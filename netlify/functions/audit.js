import { sql, DEMO_USER_ID } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { action, resource, severity = 'info', metadata } = req.body
    await sql`
      INSERT INTO audit_logs (user_id, user_name, action, resource, severity, metadata)
      VALUES (${DEMO_USER_ID}, 'Demo Admin', ${action}, ${resource ?? null}, ${severity}, ${JSON.stringify(metadata ?? null)})
    `
    return res.status(201).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
