import { sql } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  // /api/users/:id
  const idMatch = req.url.match(/\/api\/users\/([^/?]+)$/)
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
      const patch = req.body
      const allowed = ['name','email','role','status','department','avatar_url']
      const sets = []
      const vals = []
      for (const key of allowed) {
        if (key in patch) { sets.push(key); vals.push(patch[key]) }
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
    const { name, email, role = 'student', department, status = 'active' } = req.body
    const rows = await sql`
      INSERT INTO profiles (name, email, role, department, status)
      VALUES (${name}, ${email}, ${role}, ${department ?? null}, ${status})
      RETURNING *
    `
    await sql`INSERT INTO profile_stats (user_id) VALUES (${rows[0].id}) ON CONFLICT DO NOTHING`
    return res.status(201).json(rows[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
