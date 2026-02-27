import { useState, useEffect, useCallback, useRef } from 'react'
import { logAudit } from '../lib/audit'

export function useUsers(filters = {}) {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastSynced,  setLastSynced]  = useState(null)
  const [syncing,     setSyncing]     = useState(false)

  const fetchUsers = useCallback(async (silent = false) => {
    if (silent) setSyncing(true)
    else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.role)   params.set('role',   filters.role)
      if (filters.status) params.set('status', filters.status)
      const res  = await fetch(`/api/users?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch users')
      setUsers(data)
      setLastSynced(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      if (silent) setSyncing(false)
      else setLoading(false)
    }
  }, [filters.role, filters.status])

  // Initial load
  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Silent auto-sync every 30s
  useEffect(() => {
    const id = setInterval(() => fetchUsers(true), 30000)
    return () => clearInterval(id)
  }, [fetchUsers])

  async function updateUser(id, patch) {
    const res  = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    const error = res.ok ? null : { message: data.error }
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
      if (patch.role) {
        await logAudit({ action: 'user.role_changed', resource: data.name, severity: 'info',
          metadata: { newRole: patch.role } })
      }
      if (patch.status === 'inactive') {
        await logAudit({ action: 'user.deactivated', resource: data.name, severity: 'warning' })
      }
    }
    return { data: res.ok ? data : null, error }
  }

  async function deactivateUser(id) { return updateUser(id, { status: 'inactive' }) }
  async function activateUser(id)   { return updateUser(id, { status: 'active' }) }

  async function inviteUser({ email, name, role = 'student', department }) {
    const res  = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, department, status: 'active' }),
    })
    const data = await res.json()
    if (res.ok) {
      await fetchUsers()
      await logAudit({ action: 'user.created', resource: email, severity: 'info', metadata: { role } })
    }
    return { data: res.ok ? data : null, error: res.ok ? null : { message: data.error } }
  }

  return { users, loading, error, lastSynced, syncing, refetch: () => fetchUsers(true), updateUser, deactivateUser, activateUser, inviteUser }
}

export function useUser(userId) {
  const [user,     setUser]     = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    async function load() {
      const res  = await fetch(`/api/users/${userId}`)
      const data = await res.json()
      setUser(data.user)
      setAttempts(data.attempts ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  return { user, attempts, loading }
}
