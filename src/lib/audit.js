/**
 * Write an audit log entry. Call this after any significant action.
 */
export async function logAudit({ action, resource, severity = 'info', metadata = {} } = {}) {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, resource, severity, metadata }),
    })
  } catch (err) {
    // Never throw — audit failures must not break the UI
    console.warn('[audit] failed to write log:', err.message)
  }
}
