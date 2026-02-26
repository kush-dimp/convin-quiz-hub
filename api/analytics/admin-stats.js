import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const since24h = new Date(Date.now() - 86400000).toISOString()

  const [usersRes, quizzesRes, todayRes, allRes] = await Promise.all([
    sql`SELECT COUNT(*) FROM profiles`,
    sql`SELECT COUNT(*) FROM quizzes WHERE status = 'published'`,
    sql`SELECT COUNT(*) FROM quiz_attempts WHERE status IN ('submitted','graded') AND submitted_at >= ${since24h}`,
    sql`SELECT score_pct, passed FROM quiz_attempts WHERE status IN ('submitted','graded')`,
  ])

  const attempts  = allRes
  const avgScore  = attempts.length
    ? Math.round(attempts.reduce((s, r) => s + (Number(r.score_pct) || 0), 0) / attempts.length)
    : 0

  res.status(200).json({
    totalUsers:    Number(usersRes[0].count),
    activeQuizzes: Number(quizzesRes[0].count),
    quizzesToday:  Number(todayRes[0].count),
    avgScore,
    serverStatus:  'healthy',
    apiResponseMs: null,
    errorRatePct:  null,
  })
}
