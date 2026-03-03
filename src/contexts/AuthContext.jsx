import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const DEFAULT_PROFILE = {
  id:         '00000000-0000-0000-0000-000000000001',
  name:       'Demo Admin',
  email:      'admin@demo.local',
  role:       'student',
  status:     'active',
  department: null,
  avatar_url: null,
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)

  const isAdmin = profile?.role?.includes('admin') || false
  const isInstructor = profile?.role === 'instructor' || profile?.role?.includes('admin') || false

  const value = {
    session:      { user: profile },
    profile:      profile,
    loading:      loading,
    user:         profile,
    isAdmin:      isAdmin,
    isInstructor: isInstructor,
    signIn:       async (email, password) => {
      try {
        setLoading(true)
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
        const data = await res.json()
        if (res.ok && data.user) {
          setProfile(data.user)
          return { data, error: null }
        }
        return { data: null, error: { message: data.error || 'Login failed' } }
      } catch (e) {
        return { data: null, error: { message: 'Login failed' } }
      } finally {
        setLoading(false)
      }
    },
    signUp:       async (email, password, name) => {
      try {
        setLoading(true)
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
        const data = await res.json()
        if (res.ok && data.user) {
          setProfile(data.user)
          return { data, error: null }
        }
        return { data: null, error: { message: data.error || 'Signup failed' } }
      } catch (e) {
        return { data: null, error: { message: 'Signup failed' } }
      } finally {
        setLoading(false)
      }
    },
    signOut:      async () => {
      setProfile(DEFAULT_PROFILE)
    },
    updateProfile: async (updates) => {
      try {
        const res = await fetch(`/api/users/${profile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const data = await res.json()
        if (res.ok) {
          setProfile(data)
          return { data, error: null }
        }
        return { data: null, error: { message: data.error || 'Update failed' } }
      } catch (e) {
        return { data: null, error: { message: 'Update failed' } }
      }
    },
    refetchProfile: async () => {
      if (profile?.id) {
        try {
          const res = await fetch(`/api/users/${profile.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.user) setProfile(data.user)
          }
        } catch (err) {
          console.error('Failed to refetch profile:', err)
        }
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
