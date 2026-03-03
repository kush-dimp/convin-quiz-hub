import { sql } from './_db.js'

/**
 * Delete quizzes that have been in trash for 7+ days
 * Call this via: GET /api/cleanup?secret=YOUR_SECRET
 * Or set up a scheduled job to call this endpoint daily
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  try {
    // Basic auth check - use environment variable for security
    const secret = process.env.CLEANUP_SECRET || 'cleanup-secret'
    if (req.query.secret !== secret) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get count before deletion (for logging)
    const toDelete = await sql`
      SELECT id FROM quizzes
      WHERE is_deleted = true AND deleted_at < ${sevenDaysAgo.toISOString()}
    `

    // Delete quizzes and their associated data
    if (toDelete.length > 0) {
      const ids = toDelete.map(q => q.id)

      // Delete quiz results/attempts first (foreign key dependency)
      for (const id of ids) {
        await sql`DELETE FROM attempts WHERE quiz_id = ${id}`
        await sql`DELETE FROM questions WHERE quiz_id = ${id}`
        await sql`DELETE FROM quiz_stats WHERE quiz_id = ${id}`
      }

      // Delete the quizzes
      await sql`DELETE FROM quizzes WHERE is_deleted = true AND deleted_at < ${sevenDaysAgo.toISOString()}`

      console.log(`[Cleanup] Permanently deleted ${toDelete.length} quizzes from trash`)
    }

    return res.status(200).json({
      success: true,
      deleted: toDelete.length,
      message: `${toDelete.length} quiz${toDelete.length !== 1 ? 'zes' : ''} permanently deleted from trash`,
    })
  } catch (err) {
    console.error('Cleanup Error:', err)
    return res.status(500).json({ error: 'Cleanup failed: ' + (err.message || 'unknown') })
  }
}
