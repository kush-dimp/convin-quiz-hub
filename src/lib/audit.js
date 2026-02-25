import { supabase } from './supabase'

/**
 * Write an audit log entry. Call this after any significant action.
 * @param {object} opts
 * @param {string} opts.action   - e.g. 'quiz.published', 'user.role_changed'
 * @param {string} [opts.resource] - human label of the affected resource
 * @param {'info'|'warning'|'error'|'critical'} [opts.severity]
 * @param {object} [opts.metadata] - arbitrary extra context
 */
export async function logAudit({ action, resource, severity = 'info', metadata } = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('audit_logs').insert({
      user_id:   user?.id   ?? null,
      user_name: user?.user_metadata?.name ?? user?.email ?? 'System',
      action,
      resource,
      severity,
      metadata: metadata ?? null,
    })
  } catch (err) {
    // Never throw — audit failures must not break the UI
    console.warn('[audit] failed to write log:', err.message)
  }
}
