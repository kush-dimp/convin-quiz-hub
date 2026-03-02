import { sql } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    const path = req.url

    if (path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

      const rows = await sql`SELECT * FROM profiles WHERE email = ${email}`
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' })

      const user = rows[0]
      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      })
    }

    if (path === '/api/auth/register' && req.method === 'POST') {
      const { email, password, name } = req.body
      if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name required' })

      const rows = await sql`
        INSERT INTO profiles (name, email, role, status)
        VALUES (${name}, ${email}, 'student', 'active')
        RETURNING id, name, email, role
      `
      await sql`INSERT INTO profile_stats (user_id) VALUES (${rows[0].id}) ON CONFLICT DO NOTHING`

      return res.status(201).json({ user: rows[0] })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('Auth API Error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
