import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const url    = new URL(req.url, 'http://localhost')
  const quizId = url.searchParams.get('quizId')

  const rows = quizId
    ? await sql`SELECT score_pct FROM quiz_attempts WHERE status IN ('submitted','graded') AND quiz_id = ${quizId}`
    : await sql`SELECT score_pct FROM quiz_attempts WHERE status IN ('submitted','graded')`

  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${(i + 1) * 10}`,
    count: 0,
  }))
  for (const r of rows) {
    const idx = Math.min(Math.floor((Number(r.score_pct) || 0) / 10), 9)
    buckets[idx].count++
  }
  res.status(200).json(buckets)
}
