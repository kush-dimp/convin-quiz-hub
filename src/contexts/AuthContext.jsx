import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // On mount, verify JWT via /api/auth/me
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Auth verification failed:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, [])

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok && data.user) {
        setUser(data.user)
        return { data, error: null }
      }
      return { data: null, error: { message: data.error || 'Login failed' } }
    } catch (e) {
      return { data: null, error: { message: 'Login failed' } }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, name) => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      if (res.ok && data.user) {
        setUser(data.user)
        return { data, error: null }
      }
      return { data: null, error: { message: data.error || 'Signup failed' } }
    } catch (e) {
      return { data: null, error: { message: 'Signup failed' } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      navigate('/login')
    }
  }

  const updateProfile = async (updates) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data)
        return { data, error: null }
      }
      return { data: null, error: { message: data.error || 'Update failed' } }
    } catch (e) {
      return { data: null, error: { message: 'Update failed' } }
    }
  }

  const refetchProfile = async () => {
    if (user?.id) {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          credentials: 'include'
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user) setUser(data.user)
        }
      } catch (err) {
        console.error('Failed to refetch profile:', err)
      }
    }
  }

  const value = {
    session: user ? { user } : null,
    profile: user,
    user: user,
    loading: loading,
    isAuthenticated: user !== null,
    role: user?.role,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
