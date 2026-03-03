/**
 * Local cleanup cron job - runs daily at midnight
 * Usage: node scripts/cleanup-cron.js
 *
 * For production (Vercel):
 * 1. Call /api/cleanup?secret=YOUR_CLEANUP_SECRET daily via external cron service
 * 2. Or set CLEANUP_SECRET env var in Vercel dashboard
 * 3. Services: cron-job.org, GitHub Actions, AWS EventBridge, etc.
 */

import cron from 'node-cron'
import { sql } from '../api/_db.js'

const CLEANUP_SECRET = process.env.CLEANUP_SECRET || 'cleanup-secret'

async function cleanupTrash() {
  try {
    console.log('[Cleanup] Starting trash cleanup job...')

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get count before deletion
    const toDelete = await sql`
      SELECT id FROM quizzes
      WHERE is_deleted = true AND deleted_at < ${sevenDaysAgo.toISOString()}
    `

    if (toDelete.length === 0) {
      console.log('[Cleanup] No quizzes to clean up')
      return
    }

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
    console.log(`[Cleanup] Cleanup job completed at ${new Date().toISOString()}`)
  } catch (err) {
    console.error('[Cleanup] Error:', err.message)
  }
}

// Schedule: 0 0 * * * = every day at 00:00 (midnight)
cron.schedule('0 0 * * *', cleanupTrash)

console.log('[Cleanup] Cron job scheduled: Daily at 00:00 UTC')
console.log('[Cleanup] Press Ctrl+C to stop')

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Cleanup] Shutting down...')
  process.exit(0)
})
