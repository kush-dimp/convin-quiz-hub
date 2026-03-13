import { sql } from './_db.js'
import { authenticateRequest } from './_middleware.js'
import bcryptjs from 'bcryptjs'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    const path = req.query.sub ? `/api/users/${req.query.sub.split('?')[0]}` : req.url

    // /api/users/:id
    const idMatch = path.match(/\/api\/users\/([^/?]+)$/)
    if (idMatch) {
      const userId = idMatch[1]

      if (req.method === 'GET') {
        const [uRows, aRows] = await Promise.all([
          sql`SELECT p.*, ps.quizzes_taken, ps.certificates, ps.avg_score, ps.badges
              FROM profiles p LEFT JOIN profile_stats ps ON ps.user_id = p.id
              WHERE p.id = ${userId}`,
          sql`SELECT a.*, q.title FROM quiz_attempts a
              LEFT JOIN quizzes q ON q.id = a.quiz_id
              WHERE a.user_id = ${userId} AND a.status IN ('submitted','graded')
              ORDER BY a.submitted_at DESC LIMIT 50`,
        ])
        return res.status(200).json({ user: uRows[0] ?? null, attempts: aRows })
      }

      if (req.method === 'PUT') {
        const auth = authenticateRequest(req, res)
        if (auth) return auth

        const userPerms = req.user.permissions || []
        const isSelfUpdate = userId === req.user.id
        const canManageUsers = ['super_admin', 'admin'].includes(req.user.role) &&
                               userPerms.includes('users_manage')
        if (!isSelfUpdate && !canManageUsers) {
          return res.status(403).json({ error: 'Insufficient permissions to update user' })
        }

        const patch = req.body
        // Only super_admin/admin can change role/status
        const allowed = isSelfUpdate
          ? ['name','email','department','avatar_url','password']
          : ['name','email','role','status','department','avatar_url','password']
        const sets = []
        const vals = []
        for (const key of allowed) {
          if (key in patch && patch[key] !== null && patch[key] !== '') {
            if (key === 'password') {
              try {
                sets.push('password_hash')
                vals.push(await bcryptjs.hash(patch[key], 12))
              } catch (hashErr) {
                return res.status(400).json({ error: 'Failed to hash password' })
              }
            } else {
              sets.push(key)
              vals.push(patch[key])
            }
          }
        }
        if (!sets.length) return res.status(400).json({ error: 'No valid fields' })
        let updateSql = 'UPDATE profiles SET '
        updateSql += sets.map((k, i) => `${k} = $${i + 1}`).join(', ')
        updateSql += ` WHERE id = $${sets.length + 1} RETURNING *`
        const rows = await sql(updateSql, [...vals, userId])
        return res.status(200).json(rows[0])
      }
    }

    // /api/users (list + create)
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost')
      const role   = url.searchParams.get('role')
      const status = url.searchParams.get('status')

      let rows
      if (role && status) {
        rows = await sql`SELECT p.*, ps.quizzes_taken, ps.certificates, ps.avg_score, ps.badges
          FROM profiles p LEFT JOIN profile_stats ps ON ps.user_id = p.id
          WHERE p.role = ${role} AND p.status = ${status} ORDER BY p.created_at DESC`
      } else if (role) {
        rows = await sql`SELECT p.*, ps.quizzes_taken, ps.certificates, ps.avg_score, ps.badges
          FROM profiles p LEFT JOIN profile_stats ps ON ps.user_id = p.id
          WHERE p.role = ${role} ORDER BY p.created_at DESC`
      } else if (status) {
        rows = await sql`SELECT p.*, ps.quizzes_taken, ps.certificates, ps.avg_score, ps.badges
          FROM profiles p LEFT JOIN profile_stats ps ON ps.user_id = p.id
          WHERE p.status = ${status} ORDER BY p.created_at DESC`
      } else {
        rows = await sql`SELECT p.*, ps.quizzes_taken, ps.certificates, ps.avg_score, ps.badges
          FROM profiles p LEFT JOIN profile_stats ps ON ps.user_id = p.id
          ORDER BY p.created_at DESC`
      }
      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const auth = authenticateRequest(req, res)
      if (auth) return auth

      const userPerms = req.user.permissions || []
      const canCreateUsers = ['super_admin', 'admin'].includes(req.user.role) &&
                             userPerms.includes('users_manage')
      if (!canCreateUsers) {
        return res.status(403).json({ error: 'Insufficient permissions to create user' })
      }

      const { name, email, role = 'student', department, status = 'active', password } = req.body
      if (!name || !email) return res.status(400).json({ error: 'Name and email required' })
      if (!password) return res.status(400).json({ error: 'Password required' })

      let passwordHash = null
      try {
        passwordHash = await bcryptjs.hash(password, 12)
      } catch (hashErr) {
        return res.status(400).json({ error: 'Failed to hash password' })
      }

      const rows = await sql`
        INSERT INTO profiles (name, email, role, department, status, password_hash)
        VALUES (${name}, ${email}, ${role}, ${department ?? null}, ${status}, ${passwordHash})
        RETURNING *
      `
      await sql`INSERT INTO profile_stats (user_id) VALUES (${rows[0].id}) ON CONFLICT DO NOTHING`
      return res.status(201).json(rows[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Users API Error:', err)
    return res.status(500).json({ error: 'Database error: ' + (err.message || 'unknown') })
  }
}
