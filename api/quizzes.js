import { sql, DEMO_USER_ID } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  // Reconstruct full path from sub-path query param (added by vercel.json rewrite)
  const path = req.query.sub ? `/api/quizzes/${req.query.sub.split('?')[0]}` : req.url

  // Route: /api/quizzes/:id/questions
  const questionsMatch = path.match(/\/api\/quizzes\/([^/?]+)\/questions/)
  if (questionsMatch) {
    const quizId = questionsMatch[1]
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM questions WHERE quiz_id = ${quizId} ORDER BY position
      `
      return res.status(200).json(rows)
    }
    if (req.method === 'PUT') {
      const questions = req.body
      if (!Array.isArray(questions)) return res.status(400).json({ error: 'Expected array' })

      // Delete existing then re-insert
      await sql`DELETE FROM questions WHERE quiz_id = ${quizId}`
      if (questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          const { id, type, text, rich_text, points, difficulty, topic, explanation, time_limit_s, payload, created_by } = q
          const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (id && uuidRe.test(id)) {
            await sql`
              INSERT INTO questions (id, quiz_id, position, type, text, rich_text, points, difficulty, topic, explanation, time_limit_s, payload, created_by)
              VALUES (${id}, ${quizId}, ${i}, ${type}, ${text}, ${rich_text ?? null}, ${points ?? 10}, ${difficulty ?? null}, ${topic ?? null}, ${explanation ?? null}, ${time_limit_s ?? null}, ${JSON.stringify(payload ?? {})}, ${created_by ?? DEMO_USER_ID})
              ON CONFLICT (id) DO UPDATE SET position=${i}, type=${type}, text=${text}, rich_text=${rich_text ?? null}, points=${points ?? 10}, difficulty=${difficulty ?? null}, topic=${topic ?? null}, explanation=${explanation ?? null}, time_limit_s=${time_limit_s ?? null}, payload=${JSON.stringify(payload ?? {})}
            `
          } else {
            await sql`
              INSERT INTO questions (quiz_id, position, type, text, rich_text, points, difficulty, topic, explanation, time_limit_s, payload, created_by)
              VALUES (${quizId}, ${i}, ${type}, ${text}, ${rich_text ?? null}, ${points ?? 10}, ${difficulty ?? null}, ${topic ?? null}, ${explanation ?? null}, ${time_limit_s ?? null}, ${JSON.stringify(payload ?? {})}, ${created_by ?? DEMO_USER_ID})
            `
          }
        }
      }
      const saved = await sql`SELECT * FROM questions WHERE quiz_id = ${quizId} ORDER BY position`
      return res.status(200).json(saved)
    }
  }

  // Route: /api/quizzes/:id
  const idMatch = path.match(/\/api\/quizzes\/([^/?]+)$/)
  if (idMatch) {
    const quizId = idMatch[1]
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT q.*, qs.views, qs.previews, qs.reports,
               p.name as instructor_name
        FROM quizzes q
        LEFT JOIN quiz_stats qs ON qs.quiz_id = q.id
        LEFT JOIN profiles p ON p.id = q.instructor_id
        WHERE q.id = ${quizId}
      `
      if (!rows[0]) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(rows[0])
    }
    if (req.method === 'PATCH') {
      const patch = req.body
      const allowed = ['title','description','category','status','tags','is_private','thumbnail_url',
        'time_limit_mins','max_attempts','passing_score_pct','shuffle_questions','shuffle_options',
        'show_results_immediately','show_correct_answers','allow_review','certificate_enabled',
        'certificate_template','password_protected','access_password','require_proctoring']
      const sets = []
      const vals = []
      for (const key of allowed) {
        if (key in patch) { sets.push(key); vals.push(patch[key]) }
      }
      if (!sets.length) return res.status(400).json({ error: 'No valid fields' })
      // Build dynamic update using tagged template
      let updateSql = 'UPDATE quizzes SET '
      updateSql += sets.map((k, i) => `${k} = $${i + 1}`).join(', ')
      updateSql += ` WHERE id = $${sets.length + 1} RETURNING *`
      const rows = await sql(updateSql, [...vals, quizId])
      return res.status(200).json(rows[0])
    }
    if (req.method === 'DELETE') {
      await sql`DELETE FROM quizzes WHERE id = ${quizId}`
      return res.status(204).end()
    }
  }

  // Route: /api/quizzes (list + create)
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const status = url.searchParams.get('status')
    const instructorId = url.searchParams.get('instructorId')

    let rows
    if (status && instructorId) {
      rows = await sql`
        SELECT q.*, qs.views, qs.previews, qs.reports, p.name as instructor_name
        FROM quizzes q
        LEFT JOIN quiz_stats qs ON qs.quiz_id = q.id
        LEFT JOIN profiles p ON p.id = q.instructor_id
        WHERE q.status = ${status} AND q.instructor_id = ${instructorId}
        ORDER BY q.created_at DESC
      `
    } else if (status) {
      rows = await sql`
        SELECT q.*, qs.views, qs.previews, qs.reports, p.name as instructor_name
        FROM quizzes q
        LEFT JOIN quiz_stats qs ON qs.quiz_id = q.id
        LEFT JOIN profiles p ON p.id = q.instructor_id
        WHERE q.status = ${status}
        ORDER BY q.created_at DESC
      `
    } else if (instructorId) {
      rows = await sql`
        SELECT q.*, qs.views, qs.previews, qs.reports, p.name as instructor_name
        FROM quizzes q
        LEFT JOIN quiz_stats qs ON qs.quiz_id = q.id
        LEFT JOIN profiles p ON p.id = q.instructor_id
        WHERE q.instructor_id = ${instructorId}
        ORDER BY q.created_at DESC
      `
    } else {
      rows = await sql`
        SELECT q.*, qs.views, qs.previews, qs.reports, p.name as instructor_name
        FROM quizzes q
        LEFT JOIN quiz_stats qs ON qs.quiz_id = q.id
        LEFT JOIN profiles p ON p.id = q.instructor_id
        ORDER BY q.created_at DESC
      `
    }
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { title, description, category, tags, is_private, time_limit_mins, max_attempts,
            passing_score_pct, shuffle_questions, shuffle_options, show_results_immediately,
            show_correct_answers, allow_review, certificate_enabled, require_proctoring } = req.body
    const rows = await sql`
      INSERT INTO quizzes (title, description, category, tags, is_private, instructor_id,
        time_limit_mins, max_attempts, passing_score_pct, shuffle_questions, shuffle_options,
        show_results_immediately, show_correct_answers, allow_review, certificate_enabled, require_proctoring)
      VALUES (
        ${title}, ${description ?? null}, ${category ?? null}, ${tags ?? []}, ${is_private ?? false},
        ${DEMO_USER_ID}, ${time_limit_mins ?? null}, ${max_attempts ?? null},
        ${passing_score_pct ?? 70}, ${shuffle_questions ?? false}, ${shuffle_options ?? false},
        ${show_results_immediately ?? true}, ${show_correct_answers ?? true},
        ${allow_review ?? true}, ${certificate_enabled ?? false}, ${require_proctoring ?? false}
      )
      RETURNING *
    `
    return res.status(201).json(rows[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
