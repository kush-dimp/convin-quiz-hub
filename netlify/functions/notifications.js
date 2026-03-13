import { sql, DEMO_USER_ID } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const path = req.query.sub ? `/api/notifications/${req.query.sub.split('?')[0]}` : req.url

  // DELETE /api/notifications/bulk
  if (path.includes('/bulk') && req.method === 'DELETE') {
    const url = new URL(req.url, 'http://localhost')
    const userId = url.searchParams.get('userId') ?? DEMO_USER_ID
    await sql`DELETE FROM notifications WHERE user_id = ${userId} AND read = true`
    return res.status(204).end()
  }

  // PUT /api/notifications/bulk
  if (path.includes('/bulk') && req.method === 'PUT') {
    const url = new URL(req.url, 'http://localhost')
    const userId = url.searchParams.get('userId') ?? DEMO_USER_ID
    await sql`UPDATE notifications SET read = true WHERE user_id = ${userId}`
    return res.status(200).json({ ok: true })
  }

  // /api/notifications/:id
  const idMatch = path.match(/\/api\/notifications\/([^/?]+)$/)
  if (idMatch) {
    const id = idMatch[1]
    if (req.method === 'PUT') {
      const { read } = req.body
      const rows = await sql`UPDATE notifications SET read = ${read} WHERE id = ${id} RETURNING *`
      return res.status(200).json(rows[0])
    }
    if (req.method === 'DELETE') {
      await sql`DELETE FROM notifications WHERE id = ${id}`
      return res.status(204).end()
    }
  }

  // /api/notifications (list + create)
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const userId = url.searchParams.get('userId') ?? DEMO_USER_ID
    const rows = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { user_id, type, title, body, resource_type, resource_id } = req.body
    const rows = await sql`
      INSERT INTO notifications (user_id, type, title, body, resource_type, resource_id)
      VALUES (${user_id ?? DEMO_USER_ID}, ${type}, ${title}, ${body}, ${resource_type ?? null}, ${resource_id ?? null})
      RETURNING *
    `
    return res.status(201).json(rows[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
