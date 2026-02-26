import { sql } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const path = req.query.sub
    ? `/api/certificates/${req.query.sub.split('?')[0]}`
    : req.url

  // DELETE /api/certificates/:id  (revoke)
  // GET    /api/certificates/:id  (single)
  const idMatch = path.match(/\/api\/certificates\/([^/?]+)$/)
  if (idMatch) {
    const certId = idMatch[1]

    if (req.method === 'DELETE') {
      await sql`DELETE FROM certificates WHERE id = ${certId}`
      return res.status(204).end()
    }

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT c.*, p.name AS user_name, p.email AS user_email,
               q.title AS quiz_title, q.certificate_template
        FROM certificates c
        JOIN profiles p ON c.user_id = p.id
        JOIN quizzes  q ON c.quiz_id  = q.id
        WHERE c.id = ${certId}
      `
      if (!rows.length) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(rows[0])
    }
  }

  // GET /api/certificates  (list, supports ?userId= ?quizId=)
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const userId = url.searchParams.get('userId')
    const quizId = url.searchParams.get('quizId')

    const conditions = []
    const vals = []
    if (userId) { vals.push(userId); conditions.push(`c.user_id = $${vals.length}`) }
    if (quizId) { vals.push(quizId); conditions.push(`c.quiz_id = $${vals.length}`) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `
      SELECT c.*, p.name AS user_name, p.email AS user_email,
             q.title AS quiz_title, q.certificate_template
      FROM certificates c
      JOIN profiles p ON c.user_id = p.id
      JOIN quizzes  q ON c.quiz_id  = q.id
      ${where}
      ORDER BY c.issued_at DESC
    `
    const rows = await sql(query, vals)
    return res.status(200).json(rows)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
