import { sql } from './_db.js'
import { sendCertificateEmail } from './_email.js'

function calcExpiry(expiry) {
  if (!expiry || expiry === 'never') return null
  const d = new Date()
  if (expiry === '1y') { d.setFullYear(d.getFullYear() + 1); return d.toISOString() }
  if (expiry === '2y') { d.setFullYear(d.getFullYear() + 2); return d.toISOString() }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const path = req.query.sub ? `/api/results/${req.query.sub.split('?')[0]}` : req.url

  // POST /api/results/attempts/:id/answers
  const answersMatch = path.match(/\/api\/results\/attempts\/([^/?]+)\/answers/)
  if (answersMatch) {
    const attemptId = answersMatch[1]
    if (req.method === 'POST') {
      const answers = req.body
      if (!Array.isArray(answers)) return res.status(400).json({ error: 'Expected array' })
      for (const a of answers) {
        await sql`
          INSERT INTO attempt_answers (attempt_id, question_id, answer, is_correct, points_earned, time_spent_s)
          VALUES (${attemptId}, ${a.question_id}, ${JSON.stringify(a.answer ?? null)}, ${a.is_correct ?? null}, ${a.points_earned ?? 0}, ${a.time_spent_s ?? null})
          ON CONFLICT (attempt_id, question_id) DO UPDATE
            SET answer=${JSON.stringify(a.answer ?? null)}, is_correct=${a.is_correct ?? null}, points_earned=${a.points_earned ?? 0}
        `
      }
      return res.status(201).json({ ok: true })
    }
  }

  // PUT /api/results/attempts/:id
  const attemptIdMatch = path.match(/\/api\/results\/attempts\/([^/?]+)$/)
  if (attemptIdMatch) {
    const attemptId = attemptIdMatch[1]
    if (req.method === 'PUT') {
      const body = req.body
      const allowed = ['status','submitted_at','time_taken_s','score_pct','points_earned',
                       'total_points','passed','tab_switches','flagged','flag_reason']
      const sets = []
      const vals = []
      for (const key of allowed) {
        if (key in body) { sets.push(key); vals.push(body[key]) }
      }
      if (!sets.length) return res.status(400).json({ error: 'No valid fields' })
      let q = 'UPDATE quiz_attempts SET '
      q += sets.map((k, i) => `${k} = $${i + 1}`).join(', ')
      q += ` WHERE id = $${sets.length + 1} RETURNING *`
      const rows = await sql(q, [...vals, attemptId])
      const updatedAttempt = rows[0]

      // Issue certificate if quiz passed and certificate is enabled
      let certificate = null
      if (updatedAttempt && updatedAttempt.status === 'submitted' && updatedAttempt.passed) {
        const quizRows = await sql`
          SELECT certificate_enabled, certificate_template, title
          FROM quizzes WHERE id = ${updatedAttempt.quiz_id}
        `
        const quiz = quizRows[0]
        if (quiz?.certificate_enabled) {
          let tpl = {}
          try { tpl = JSON.parse(quiz.certificate_template || '{}') } catch {}
          const expiresAt = calcExpiry(tpl.expiry)

          await sql`
            INSERT INTO certificates (user_id, quiz_id, attempt_id, expires_at)
            VALUES (${updatedAttempt.user_id}, ${updatedAttempt.quiz_id},
                    ${updatedAttempt.id}, ${expiresAt})
            ON CONFLICT (user_id, quiz_id) DO NOTHING
          `
          const certRows = await sql`
            SELECT * FROM certificates
            WHERE user_id = ${updatedAttempt.user_id}
              AND quiz_id  = ${updatedAttempt.quiz_id}
          `
          certificate = certRows[0] ?? null

          // Send certificate email (fire-and-forget; never blocks the response)
          if (certificate && tpl.autoEmail !== false) {
            const profileRows = await sql`
              SELECT email, name FROM profiles WHERE id = ${updatedAttempt.user_id}
            `
            const profile = profileRows[0]
            if (profile?.email) {
              sendCertificateEmail({
                to:           profile.email,
                name:         profile.name  || 'Participant',
                quizTitle:    quiz.title    || 'Quiz',
                scorePct:     Math.round(Number(updatedAttempt.score_pct) || 0),
                certId:       certificate.id,
                issuedAt:     certificate.issued_at,
                primaryColor: tpl.primaryColor,
              }).catch(err => console.error('[email] cert email failed (non-fatal):', err))
            }
          }
        }
      }

      return res.status(200).json({ ...updatedAttempt, certificate })
    }
  }

  // POST /api/results/attempts
  if (path.endsWith('/attempts') || path.includes('/attempts?')) {
    if (req.method === 'POST') {
      const { quiz_id, user_id, attempt_number, status, started_at } = req.body
      const rows = await sql`
        INSERT INTO quiz_attempts (quiz_id, user_id, attempt_number, status, started_at)
        VALUES (${quiz_id}, ${user_id}, ${attempt_number ?? 1}, ${status ?? 'in_progress'}, ${started_at ?? new Date().toISOString()})
        RETURNING *
      `
      return res.status(201).json(rows[0])
    }
  }

  // GET /api/results/stats
  if (path.includes('/stats')) {
    const url = new URL(req.url, 'http://localhost')
    const quizId = url.searchParams.get('quizId')
    let rows
    if (quizId) {
      rows = await sql`
        SELECT score_pct, passed, time_taken_s FROM quiz_attempts
        WHERE status IN ('submitted','graded') AND quiz_id = ${quizId}
      `
    } else {
      rows = await sql`
        SELECT score_pct, passed, time_taken_s FROM quiz_attempts
        WHERE status IN ('submitted','graded')
      `
    }
    if (!rows.length) return res.status(200).json(null)
    const total    = rows.length
    const passed   = rows.filter(r => r.passed).length
    const avgScore = Math.round(rows.reduce((s, r) => s + (Number(r.score_pct) || 0), 0) / total)
    const avgTime  = Math.round(rows.reduce((s, r) => s + (r.time_taken_s || 0), 0) / total / 60)
    const passRate = Math.round((passed / total) * 100)
    return res.status(200).json({ total, passed, avgScore, avgTime, passRate })
  }

  // /api/results/:id
  const idMatch = path.match(/\/api\/results\/([^/?]+)$/)
  if (idMatch) {
    const attemptId = idMatch[1]
    if (req.method === 'DELETE') {
      await sql`DELETE FROM quiz_attempts WHERE id = ${attemptId}`
      return res.status(204).end()
    }
    if (req.method === 'GET') {
      const [aRows, ansRows] = await Promise.all([
        sql`
          SELECT a.*, p.name, p.email, q.title, q.passing_score_pct
          FROM quiz_attempts a
          LEFT JOIN profiles p ON p.id = a.user_id
          LEFT JOIN quizzes q ON q.id = a.quiz_id
          WHERE a.id = ${attemptId}
        `,
        sql`
          SELECT aa.*, qn.text, qn.type, qn.payload, qn.points, qn.explanation
          FROM attempt_answers aa
          LEFT JOIN questions qn ON qn.id = aa.question_id
          WHERE aa.attempt_id = ${attemptId}
        `,
      ])
      return res.status(200).json({ attempt: aRows[0] ?? null, answers: ansRows })
    }
  }

  // GET /api/results (list)
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const quizId  = url.searchParams.get('quizId')
    const userId  = url.searchParams.get('userId')
    const flagged = url.searchParams.get('flagged')
    const limit   = url.searchParams.get('limit')

    const conditions = ["a.status IN ('submitted','graded')"]
    const vals = []
    if (quizId)  { vals.push(quizId);  conditions.push(`a.quiz_id = $${vals.length}`) }
    if (userId)  { vals.push(userId);  conditions.push(`a.user_id = $${vals.length}`) }
    if (flagged === 'true') conditions.push('a.flagged = true')

    let query = `
      SELECT a.*, p.name as user_name, p.email, q.title as quiz_title
      FROM quiz_attempts a
      LEFT JOIN profiles p ON p.id = a.user_id
      LEFT JOIN quizzes q ON q.id = a.quiz_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.submitted_at DESC
    `
    if (limit) { vals.push(parseInt(limit)); query += ` LIMIT $${vals.length}` }

    const rows = await sql(query, vals)

    function formatTime(secs) {
      if (!secs) return '0m 0s'
      return `${Math.floor(secs / 60)}m ${secs % 60}s`
    }

    const normalised = rows.map(r => ({
      id:          r.id,
      userName:    r.user_name  ?? 'Unknown',
      email:       r.email      ?? '',
      quizTitle:   r.quiz_title ?? '',
      score:       Math.round(Number(r.score_pct) || 0),
      points:      r.points_earned  ?? 0,
      totalPoints: r.total_points   ?? 0,
      passed:      r.passed         ?? false,
      timeTaken:   formatTime(r.time_taken_s),
      timeMins:    Math.round((r.time_taken_s ?? 0) / 60),
      date:        r.submitted_at,
      attempt:     r.attempt_number,
      flagged:     r.flagged,
      tabSwitches: r.tab_switches,
      userId:      r.user_id,
      quizId:      r.quiz_id,
      _raw:        r,
    }))
    return res.status(200).json(normalised)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
