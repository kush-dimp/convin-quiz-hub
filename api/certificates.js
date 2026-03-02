import { sql } from './_db.js'

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
      try {
        const rows = await sql`SELECT name, content_type, data FROM certificate_templates WHERE id = ${templateId}`
        if (!rows.length) return res.status(404).json({ error: 'Template not found' })
        const tmpl = rows[0]
        res.setHeader('Content-Type', tmpl.content_type)
        res.setHeader('Content-Disposition', `attachment; filename="${tmpl.name}"`)
        return res.status(200).send(tmpl.data)
      } catch (err) {
        return res.status(500).json({ error: 'Failed to download template' })
      }
    }
    if (req.method === 'DELETE') {
      try {
        await sql`DELETE FROM certificate_templates WHERE id = ${templateId}`
        return res.status(204).end()
      } catch (err) {
        return res.status(500).json({ error: 'Failed to delete template' })
      }
    }
  }

  // List templates
  if (path === '/api/certificates/templates' && req.method === 'GET') {
    try {
      const rows = await sql`SELECT id, name, content_type, file_size, created_at FROM certificate_templates ORDER BY created_at DESC`
      return res.status(200).json(rows.map(r => ({
        id: r.id, name: r.name, contentType: r.content_type, size: r.file_size, uploadedAt: r.created_at
      })))
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch templates' })
    }
  }

  // Upload template
  if (path === '/api/certificates/templates' && req.method === 'POST') {
    const { name, data, contentType } = req.body
    if (!name || !data || !contentType) return res.status(400).json({ error: 'Missing required fields' })
    try {
      const buf = Buffer.from(data, 'base64')
      const rows = await sql`
        INSERT INTO certificate_templates (name, content_type, data, file_size)
        VALUES (${name}, ${contentType}, ${buf}, ${buf.length})
        RETURNING id, name, content_type
      `
      return res.status(201).json({ id: rows[0].id, name: rows[0].name, contentType: rows[0].content_type })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to upload template: ' + err.message })
    }
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
