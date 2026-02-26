import { sql } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET') {
    const url    = new URL(req.url, 'http://localhost')
    const quizId = url.searchParams.get('quizId')
    if (!quizId) return res.status(400).json({ error: 'quizId required' })

    const rows = await sql`
      SELECT qv.*, p.name as creator_name
      FROM quiz_versions qv
      LEFT JOIN profiles p ON p.id = qv.created_by
      WHERE qv.quiz_id = ${quizId}
      ORDER BY qv.version_num DESC
    `
    return res.status(200).json(rows)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
