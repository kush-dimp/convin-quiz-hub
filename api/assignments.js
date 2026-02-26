import { sql, DEMO_USER_ID } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  // /api/assignments/:id
  const idMatch = req.url.match(/\/api\/assignments\/([^/?]+)$/)
  if (idMatch) {
    const id = idMatch[1]

    if (req.method === 'PUT') {
      const patch = req.body
      const allowed = ['status','due_date','required','recurring','recurring_interval']
      const sets = []
      const vals = []
      for (const key of allowed) {
        if (key in patch) { sets.push(key); vals.push(patch[key]) }
      }
      if (!sets.length) return res.status(400).json({ error: 'No valid fields' })
      let updateSql = 'UPDATE assignments SET '
      updateSql += sets.map((k, i) => `${k} = $${i + 1}`).join(', ')
      updateSql += ` WHERE id = $${sets.length + 1} RETURNING *`
      const rows = await sql(updateSql, [...vals, id])
      return res.status(200).json(rows[0])
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM assignments WHERE id = ${id}`
      return res.status(204).end()
    }
  }

  // /api/assignments (list + create)
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const status = url.searchParams.get('status')

    let rows
    if (status) {
      rows = await sql`
        SELECT a.*, q.id as quiz_id_fk, q.title as quiz_title,
               p.name as target_user_name, g.name as target_group_name
        FROM assignments a
        LEFT JOIN quizzes q ON q.id = a.quiz_id
        LEFT JOIN profiles p ON p.id = a.target_user_id
        LEFT JOIN groups g ON g.id = a.target_group_id
        WHERE a.status = ${status}
        ORDER BY a.created_at DESC
      `
    } else {
      rows = await sql`
        SELECT a.*, q.id as quiz_id_fk, q.title as quiz_title,
               p.name as target_user_name, g.name as target_group_name
        FROM assignments a
        LEFT JOIN quizzes q ON q.id = a.quiz_id
        LEFT JOIN profiles p ON p.id = a.target_user_id
        LEFT JOIN groups g ON g.id = a.target_group_id
        ORDER BY a.created_at DESC
      `
    }

    const normalised = rows.map(a => ({
      ...a,
      quizTitle:  a.quiz_title ?? '',
      assignedTo: a.assign_type === 'user'  ? (a.target_user_name  ?? a.target_user_id)
                : a.assign_type === 'group' ? (a.target_group_name ?? a.target_group_id)
                : 'All Users',
      type:    a.assign_type,
      dueDate: a.due_date,
    }))
    return res.status(200).json(normalised)
  }

  if (req.method === 'POST') {
    const { quiz_id, assign_type = 'all', target_user_id, target_group_id,
            due_date, required = true, recurring = false, recurring_interval } = req.body
    const rows = await sql`
      INSERT INTO assignments (quiz_id, assign_type, target_user_id, target_group_id,
        due_date, required, recurring, recurring_interval, created_by)
      VALUES (${quiz_id}, ${assign_type}, ${target_user_id ?? null}, ${target_group_id ?? null},
        ${due_date ?? null}, ${required}, ${recurring}, ${recurring_interval ?? null}, ${DEMO_USER_ID})
      RETURNING *
    `
    return res.status(201).json(rows[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
