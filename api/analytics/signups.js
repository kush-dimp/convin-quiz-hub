import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const rows = await sql`SELECT created_at FROM profiles ORDER BY created_at`

  const map = {}
  for (const r of rows) {
    const month = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short' })
    map[month] = (map[month] ?? 0) + 1
  }
  res.status(200).json(Object.entries(map).map(([month, signups]) => ({ month, signups })))
}
