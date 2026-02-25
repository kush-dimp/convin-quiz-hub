import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

/** List all users (profiles) with optional filters. */
export function useUsers(filters = {}) {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('profiles')
        .select('*, profile_stats(*)')
        .order('created_at', { ascending: false })

      if (filters.role)   q = q.eq('role',   filters.role)
      if (filters.status) q = q.eq('status', filters.status)

      const { data, error } = await q
      if (error) throw error
      setUsers(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.role, filters.status])

  useEffect(() => { fetch() }, [fetch])

  async function updateUser(id, patch) {
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
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
    return { data, error }
  }

  async function deactivateUser(id) {
    return updateUser(id, { status: 'inactive' })
  }

  async function activateUser(id) {
    return updateUser(id, { status: 'active' })
  }

  // Invite a new user by email (creates Supabase Auth user)
  // Note: requires Supabase email confirmation or auto-confirm setting
  async function inviteUser({ email, name, role = 'student', department }) {
    // First, sign up the user (they will receive a confirmation email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: generateTempPassword(),
      options: { data: { name } },
    })
    if (error) return { error }

    // Then update their profile with extra fields
    if (data.user) {
      await supabase.from('profiles').update({ role, department, status: 'active' })
        .eq('id', data.user.id)
      await logAudit({ action: 'user.created', resource: email, severity: 'info',
        metadata: { role } })
    }
    return { data, error: null }
  }

  return { users, loading, error, refetch: fetch, updateUser, deactivateUser, activateUser, inviteUser }
}

/** Fetch a single user with their attempt history. */
export function useUser(userId) {
  const [user,     setUser]     = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    async function load() {
      const [uRes, aRes] = await Promise.all([
        supabase.from('profiles').select('*, profile_stats(*)').eq('id', userId).single(),
        supabase.from('quiz_attempts')
          .select('*, quizzes(title)')
          .eq('user_id', userId)
          .in('status', ['submitted', 'graded'])
          .order('submitted_at', { ascending: false })
          .limit(50),
      ])
      setUser(uRes.data)
      setAttempts(aRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  return { user, attempts, loading }
}

function generateTempPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!1'
}
