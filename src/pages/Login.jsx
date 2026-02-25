import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate   = useNavigate()
  const { signIn, signUp } = useAuth()

  const [mode,     setMode]     = useState('login')   // 'login' | 'signup'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        navigate('/')
      }
    } else {
      if (!name.trim()) { setError('Name is required.'); setLoading(false); return }
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 mb-4">
            <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight">QuizPlatform</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            {mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 mb-6">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all capitalize ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-[12px] rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[12px] rounded-xl px-3 py-2.5 mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alice Johnson"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-[13px] font-semibold shadow-sm shadow-indigo-200 transition-all mt-2"
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          By continuing you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  )
}
