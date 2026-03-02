import { sql } from './_db.js'

// Store templates in memory (in production, use blob storage or database)
const templates = new Map()

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const path = req.query.sub
    ? `/api/certificates/${req.query.sub.split('?')[0]}`
    : req.url

  // Template upload/download routes
  const templateMatch = path.match(/\/api\/certificates\/templates\/([^/?]+)$/)
  if (templateMatch) {
    const templateId = templateMatch[1]
    if (req.method === 'GET') {
      const tmpl = templates.get(templateId)
      if (!tmpl) return res.status(404).json({ error: 'Template not found' })
      res.setHeader('Content-Type', tmpl.contentType)
      return res.status(200).send(Buffer.from(tmpl.data, 'base64'))
    }
    if (req.method === 'DELETE') {
      templates.delete(templateId)
      return res.status(204).end()
    }
  }

  // List templates
  if (path === '/api/certificates/templates' && req.method === 'GET') {
    const list = Array.from(templates.entries()).map(([id, tmpl]) => ({
      id, name: tmpl.name, contentType: tmpl.contentType, size: tmpl.size, uploadedAt: tmpl.uploadedAt
    }))
    return res.status(200).json(list)
  }

  // Upload template
  if (path === '/api/certificates/templates' && req.method === 'POST') {
    const { name, data, contentType } = req.body
    if (!name || !data || !contentType) return res.status(400).json({ error: 'Missing required fields' })
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    templates.set(id, { id, name, data, contentType, size: Buffer.byteLength(data, 'base64'), uploadedAt: new Date().toISOString() })
    return res.status(201).json({ id, name, contentType })
  }

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
               q.title AS quiz_title, q.certificate_template,
               a.score_pct
        FROM certificates c
        JOIN profiles p ON c.user_id = p.id
        JOIN quizzes  q ON c.quiz_id  = q.id
        LEFT JOIN quiz_attempts a ON a.id = c.attempt_id
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
             q.title AS quiz_title, q.certificate_template,
             a.score_pct
      FROM certificates c
      JOIN profiles p ON c.user_id = p.id
      JOIN quizzes  q ON c.quiz_id  = q.id
      LEFT JOIN quiz_attempts a ON a.id = c.attempt_id
      ${where}
      ORDER BY c.issued_at DESC
    `
    const rows = await sql(query, vals)
    return res.status(200).json(rows)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
