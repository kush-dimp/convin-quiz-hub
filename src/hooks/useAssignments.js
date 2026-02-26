import { useState, useEffect, useCallback } from 'react'
import { logAudit } from '../lib/audit'
import { createNotification } from '../lib/notify'

export function useAssignments(filters = {}) {
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      const res  = await fetch(`/api/assignments?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch assignments')
      setAssignments(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.status])

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  async function createAssignment(payload) {
    const res  = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) {
      await logAudit({ action: 'assignment.created', resource: payload.quizTitle, severity: 'info' })
      if (payload.assign_type === 'all') {
        const usersRes = await fetch('/api/users')
        const users = await usersRes.json()
        for (const u of users ?? []) {
          await createNotification({
            userId: u.id, type: 'assignment',
            title: 'New Quiz Assigned',
            body: `"${payload.quizTitle}" has been assigned to you.`,
            resourceType: 'quiz', resourceId: payload.quiz_id,
          })
        }
      }
      await fetchAssignments()
    }
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data.error } }
  }

  async function updateAssignment(id, patch) {
    const res  = await fetch(`/api/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (res.ok) await fetchAssignments()
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data.error } }
  }

  async function deleteAssignment(id) {
    const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== id))
      await logAudit({ action: 'assignment.deleted', severity: 'warning' })
    }
    return { error: res.ok ? null : { message: 'Failed to delete' } }
  }

  return { assignments, loading, error, refetch: fetchAssignments, createAssignment, updateAssignment, deleteAssignment }
}
