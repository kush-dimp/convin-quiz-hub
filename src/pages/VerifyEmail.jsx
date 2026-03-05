import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    // Call verify endpoint (routed through /api/auth)
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
        } else {
          setStatus('success')
          setMessage('Email verified successfully!')
          setTimeout(() => navigate('/login'), 2000)
        }
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-[#FF6B9D] mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying email...</h1>
            <p className="text-slate-600">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Email verified!</h1>
            <p className="text-slate-600">{message}</p>
            <p className="text-sm text-slate-500 mt-4">Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification failed</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-[#FF6B9D] text-white rounded-lg font-medium hover:bg-[#E63E6D]"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
