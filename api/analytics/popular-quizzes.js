import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const url   = new URL(req.url, 'http://localhost')
  const limit = parseInt(url.searchParams.get('limit') ?? '5')

  const rows = await sql`
    SELECT q.title, COUNT(a.id) as attempts
    FROM quiz_attempts a
    JOIN quizzes q ON q.id = a.quiz_id
    WHERE a.status IN ('submitted','graded')
    GROUP BY q.id, q.title
    ORDER BY attempts DESC
    LIMIT ${limit}
  `

  res.status(200).json(rows.map(r => ({ name: r.title, attempts: Number(r.attempts) })))
}
