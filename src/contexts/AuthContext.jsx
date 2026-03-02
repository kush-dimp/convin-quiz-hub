import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

const DEMO_PROFILE = {
  id:         '00000000-0000-0000-0000-000000000001',
  name:       'Demo Admin',
  email:      'admin@demo.local',
  role:       'super_admin',
  status:     'active',
  department: null,
  avatar_url: null,
}

const DEMO_SESSION = { user: DEMO_PROFILE }

export function AuthProvider({ children }) {
  const value = {
    session:      DEMO_SESSION,
    profile:      DEMO_PROFILE,
    loading:      false,
    user:         DEMO_PROFILE,
    isAdmin:      true,
    isInstructor: true,
    signIn:       async (email, password) => {
      try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
        const data = await res.json()
        return res.ok ? { data, error: null } : { data: null, error: { message: data.error || 'Login failed' } }
      } catch (e) {
        return { data: null, error: { message: 'Login failed' } }
      }
    },
    signUp:       async (email, password, name) => {
      try {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
        const data = await res.json()
        return res.ok ? { data, error: null } : { data: null, error: { message: data.error || 'Signup failed' } }
      } catch (e) {
        return { data: null, error: { message: 'Signup failed' } }
      }
    },
    signOut:      async () => {},
    updateProfile: async () => ({ data: null, error: null }),
    refetchProfile: () => {},
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
