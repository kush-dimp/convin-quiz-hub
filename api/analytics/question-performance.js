import { sql } from '../_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const url    = new URL(req.url, 'http://localhost')
  const quizId = url.searchParams.get('quizId')

  let rows
  if (quizId) {
    rows = await sql`
      SELECT aa.question_id, aa.is_correct, aa.time_spent_s,
             q.text, q.position, q.difficulty
      FROM attempt_answers aa
      JOIN questions q ON q.id = aa.question_id
      WHERE q.quiz_id = ${quizId}
    `
  } else {
    rows = await sql`
      SELECT aa.question_id, aa.is_correct, aa.time_spent_s,
             q.text, q.position, q.difficulty
      FROM attempt_answers aa
      JOIN questions q ON q.id = aa.question_id
    `
  }

  const map = {}
  for (const r of rows) {
    const qid = r.question_id
    if (!map[qid]) map[qid] = {
      id:         qid,
      text:       r.text       ?? '',
      difficulty: r.difficulty ?? 'Medium',
      correct: 0, total: 0, totalTime: 0,
    }
    map[qid].total++
    if (r.is_correct) map[qid].correct++
    map[qid].totalTime += r.time_spent_s ?? 0
  }

  const result = Object.values(map).map(q => ({
    ...q,
    avgTime:             Math.round(q.totalTime / q.total),
    discriminationIndex: parseFloat(((q.correct / q.total) - 0.5).toFixed(2)),
  }))
  res.status(200).json(result)
}
