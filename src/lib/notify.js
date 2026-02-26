/**
 * Create a notification row for a user.
 */
export async function createNotification({
  userId, type, title, body, resourceType, resourceId,
} = {}) {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:       userId,
        type,
        title,
        body,
        resource_type: resourceType ?? null,
        resource_id:   resourceId   ?? null,
      }),
    })
  } catch (err) {
    console.warn('[notify] failed to create notification:', err.message)
  }
}
