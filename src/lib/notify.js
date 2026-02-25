import { supabase } from './supabase'

/**
 * Create a notification row for a user.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {'assignment'|'reminder'|'result'|'certificate'|'overdue'|'system'|'feedback'} opts.type
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {string} [opts.resourceType] - 'quiz' | 'assignment' | 'result'
 * @param {string} [opts.resourceId]   - UUID of the related resource
 */
export async function createNotification({
  userId, type, title, body, resourceType, resourceId,
} = {}) {
  try {
    await supabase.from('notifications').insert({
      user_id:       userId,
      type,
      title,
      body,
      resource_type: resourceType ?? null,
      resource_id:   resourceId   ?? null,
    })
  } catch (err) {
    console.warn('[notify] failed to create notification:', err.message)
  }
}
