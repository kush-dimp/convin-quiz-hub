import { sql, DEMO_USER_ID } from './_db.js'

// Question bank: questions where quiz_id IS NULL
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  const path = req.query.sub ? `/api/questions/${req.query.sub.split('?')[0]}` : req.url

  // /api/questions/:id
  const idMatch = path.match(/\/api\/questions\/([^/?]+)$/)
  if (idMatch) {
    const qid = idMatch[1]

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const patch = req.body
      const allowed = ['text','type','difficulty','topic','points','explanation','payload']
      const sets = []
      const vals = []
      for (const key of allowed) {
        if (key in patch) {
          sets.push(key)
          vals.push(key === 'payload' ? JSON.stringify(patch[key]) : patch[key])
        }
      }
      if (!sets.length) return res.status(400).json({ error: 'No valid fields' })
      let q = 'UPDATE questions SET '
      q += sets.map((k, i) => `${k} = $${i + 1}`).join(', ')
      q += ` WHERE id = $${sets.length + 1} RETURNING *`
      const rows = await sql(q, [...vals, qid])
      return res.status(200).json(rows[0])
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM questions WHERE id = ${qid}`
      return res.status(204).end()
    }
  }

  // /api/questions (list + create)
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT * FROM questions WHERE quiz_id IS NULL ORDER BY created_at DESC
    `
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { type = 'mcq_single', text = 'New Question', difficulty = 'Medium',
            topic = 'General', points = 10, payload = {} } = req.body ?? {}
    const rows = await sql`
      INSERT INTO questions (quiz_id, type, text, difficulty, topic, points, payload, created_by)
      VALUES (NULL, ${type}, ${text}, ${difficulty}, ${topic}, ${points}, ${JSON.stringify(payload)}, ${DEMO_USER_ID})
      RETURNING *
    `
    return res.status(201).json(rows[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
