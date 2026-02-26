import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const slug = req.query.slug
  const url  = new URL(req.url, 'http://localhost')

  // ── admin-stats ────────────────────────────────────────────────────────────
  if (slug === 'admin-stats') {
    const since24h = new Date(Date.now() - 86400000).toISOString()
    const [usersRes, quizzesRes, todayRes, allRes] = await Promise.all([
      sql`SELECT COUNT(*) FROM profiles`,
      sql`SELECT COUNT(*) FROM quizzes WHERE status = 'published'`,
      sql`SELECT COUNT(*) FROM quiz_attempts WHERE status IN ('submitted','graded') AND submitted_at >= ${since24h}`,
      sql`SELECT score_pct FROM quiz_attempts WHERE status IN ('submitted','graded')`,
    ])
    const avgScore = allRes.length
      ? Math.round(allRes.reduce((s, r) => s + (Number(r.score_pct) || 0), 0) / allRes.length)
      : 0
    return res.status(200).json({
      totalUsers:    Number(usersRes[0].count),
      activeQuizzes: Number(quizzesRes[0].count),
      quizzesToday:  Number(todayRes[0].count),
      avgScore,
      serverStatus:  'healthy',
      apiResponseMs: null,
      errorRatePct:  null,
    })
  }

  // ── score-distribution ────────────────────────────────────────────────────
  if (slug === 'score-distribution') {
    const quizId = url.searchParams.get('quizId')
    const rows = quizId
      ? await sql`SELECT score_pct FROM quiz_attempts WHERE status IN ('submitted','graded') AND quiz_id = ${quizId}`
      : await sql`SELECT score_pct FROM quiz_attempts WHERE status IN ('submitted','graded')`
    const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}–${(i + 1) * 10}`, count: 0 }))
    for (const r of rows) {
      const idx = Math.min(Math.floor((Number(r.score_pct) || 0) / 10), 9)
      buckets[idx].count++
    }
    return res.status(200).json(buckets)
  }

  // ── performance ───────────────────────────────────────────────────────────
  if (slug === 'performance') {
    const days  = parseInt(url.searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const rows  = await sql`
      SELECT score_pct, submitted_at FROM quiz_attempts
      WHERE status IN ('submitted','graded') AND submitted_at >= ${since}
      ORDER BY submitted_at
    `
    const map = {}
    for (const r of rows) {
      const day = new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!map[day]) map[day] = { date: day, attempts: 0, totalScore: 0 }
      map[day].attempts++
      map[day].totalScore += Number(r.score_pct) || 0
    }
    return res.status(200).json(Object.values(map).map(d => ({
      date: d.date, attempts: d.attempts, avgScore: Math.round(d.totalScore / d.attempts),
    })))
  }

  // ── question-performance ──────────────────────────────────────────────────
  if (slug === 'question-performance') {
    const quizId = url.searchParams.get('quizId')
    const rows = quizId
      ? await sql`
          SELECT aa.question_id, aa.is_correct, aa.time_spent_s, q.text, q.difficulty
          FROM attempt_answers aa JOIN questions q ON q.id = aa.question_id
          WHERE q.quiz_id = ${quizId}`
      : await sql`
          SELECT aa.question_id, aa.is_correct, aa.time_spent_s, q.text, q.difficulty
          FROM attempt_answers aa JOIN questions q ON q.id = aa.question_id`
    const map = {}
    for (const r of rows) {
      if (!map[r.question_id]) map[r.question_id] = { id: r.question_id, text: r.text ?? '', difficulty: r.difficulty ?? 'Medium', correct: 0, total: 0, totalTime: 0 }
      map[r.question_id].total++
      if (r.is_correct) map[r.question_id].correct++
      map[r.question_id].totalTime += r.time_spent_s ?? 0
    }
    return res.status(200).json(Object.values(map).map(q => ({
      ...q,
      avgTime: Math.round(q.totalTime / q.total),
      discriminationIndex: parseFloat(((q.correct / q.total) - 0.5).toFixed(2)),
    })))
  }

  // ── signups ───────────────────────────────────────────────────────────────
  if (slug === 'signups') {
    const rows = await sql`SELECT created_at FROM profiles ORDER BY created_at`
    const map = {}
    for (const r of rows) {
      const month = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short' })
      map[month] = (map[month] ?? 0) + 1
    }
    return res.status(200).json(Object.entries(map).map(([month, signups]) => ({ month, signups })))
  }

  // ── popular-quizzes ───────────────────────────────────────────────────────
  if (slug === 'popular-quizzes') {
    const limit = parseInt(url.searchParams.get('limit') ?? '5')
    const rows  = await sql`
      SELECT q.title, COUNT(a.id) as attempts
      FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.status IN ('submitted','graded')
      GROUP BY q.id, q.title
      ORDER BY attempts DESC
      LIMIT ${limit}
    `
    return res.status(200).json(rows.map(r => ({ name: r.title, attempts: Number(r.attempts) })))
  }

  res.status(404).json({ error: 'Unknown analytics endpoint' })
}
