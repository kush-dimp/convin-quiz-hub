import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const url   = new URL(req.url, 'http://localhost')
  const days  = parseInt(url.searchParams.get('days') ?? '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const rows = await sql`
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

  const result = Object.values(map).map(d => ({
    date:     d.date,
    attempts: d.attempts,
    avgScore: Math.round(d.totalScore / d.attempts),
  }))
  res.status(200).json(result)
}
