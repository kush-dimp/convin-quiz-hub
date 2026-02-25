import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import { createNotification } from '../lib/notify'

export function useAssignments(filters = {}) {
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('assignments')
        .select(`
          *,
          quizzes!assignments_quiz_id_fkey (id, title),
          profiles!assignments_target_user_id_fkey (name),
          groups!assignments_target_group_id_fkey (name)
        `)
        .order('created_at', { ascending: false })

      if (filters.status) q = q.eq('status', filters.status)

      const { data, error } = await q
      if (error) throw error

      // Normalise to match existing component shape
      const normalised = (data ?? []).map(a => ({
        ...a,
        quizTitle:  a.quizzes?.title ?? '',
        assignedTo: a.assign_type === 'user'  ? (a.profiles?.name ?? a.target_user_id)
                  : a.assign_type === 'group' ? (a.groups?.name   ?? a.target_group_id)
                  : 'All Users',
        type:       a.assign_type,
        dueDate:    a.due_date,
      }))
      setAssignments(normalised)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.status])

  useEffect(() => { fetch() }, [fetch])

  async function createAssignment(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('assignments')
      .insert({ ...payload, created_by: user.id })
      .select()
      .single()
    if (!error) {
      await logAudit({ action: 'assignment.created', resource: payload.quizTitle, severity: 'info' })
      // Notify affected users (simplified: notify for 'all' type, skip group/user lookup)
      if (payload.assign_type === 'all') {
        const { data: users } = await supabase.from('profiles').select('id')
        for (const u of users ?? []) {
          await createNotification({
            userId: u.id, type: 'assignment',
            title: 'New Quiz Assigned',
            body: `"${payload.quizTitle}" has been assigned to you.`,
            resourceType: 'quiz', resourceId: payload.quiz_id,
          })
        }
      }
      await fetch()
    }
    return { data, error }
  }

  async function updateAssignment(id, patch) {
    const { data, error } = await supabase
      .from('assignments')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetch()
    return { data, error }
  }

  async function deleteAssignment(id) {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (!error) {
      setAssignments(prev => prev.filter(a => a.id !== id))
      await logAudit({ action: 'assignment.deleted', severity: 'warning' })
    }
    return { error }
  }

  return { assignments, loading, error, refetch: fetch, createAssignment, updateAssignment, deleteAssignment }
}
