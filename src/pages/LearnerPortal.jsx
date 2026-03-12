import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import QuizCard from '../components/QuizCard'
import { AlertCircle, Trophy, RotateCcw } from 'lucide-react'

const LOADING_MESSAGES = [
  'Preparing your quizzes...',
  'Sharpening your brain...',
  'Loading challenges...',
  'Getting you ready...',
  'Unlocking your potential...',
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-40 bg-gradient-to-r from-slate-200 to-slate-100 animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4 animate-shimmer" />
        <div className="h-3 bg-slate-200 rounded w-1/2 animate-shimmer" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-slate-200 rounded-full w-16 animate-shimmer" />
          <div className="h-6 bg-slate-200 rounded-full w-16 animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

function LoadingState({ message }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        @keyframes float-spin {
          0% { transform: translateY(0px) rotateZ(0deg); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px) rotateZ(360deg); }
        }
        .animate-float-spin { animation: float-spin 2.5s ease-in-out infinite; }
      `}</style>
      {/* Centered loader overlay */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <Trophy className="w-12 h-12 text-[#FF6B9D] mx-auto animate-float-spin" />
          </div>
          <p className="text-slate-600 font-medium mb-2">{message}</p>
          <div className="w-48 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] rounded-full w-1/3 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Skeleton cards in background */}
      <div className="px-6 pb-6 pointer-events-none opacity-40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LearnerPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])

  useEffect(() => {
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)])
  }, [loading])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const assignRes = await fetch(`/api/assignments?userId=${user.id}`, {
        credentials: 'include'
      })
      if (!assignRes.ok) throw new Error('Failed to fetch assignments')
      const assignData = await assignRes.json()
      setAssignments(assignData)

      const quizIds = [...new Set(assignData.map(a => a.quiz_id))]
      if (quizIds.length > 0) {
        const quizzes = await Promise.all(
          quizIds.map(id =>
            fetch(`/api/quizzes/${id}`, { credentials: 'include' })
              .then(r => r.ok ? r.json() : null)
          )
        )
        setQuizzes(quizzes.filter(Boolean))
      }
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError('Unable to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  if (loading) {
    return <LoadingState message={loadingMessage} />
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
      <div className="max-w-6xl mx-auto w-full animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Learning Path</h1>
          <p className="text-slate-600">Complete your assigned quizzes to earn certificates</p>
        </div>

        {/* Error alert with retry */}
        {error && (
          <div className="mb-6 flex items-start justify-between bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Quizzes grid with fade-in */}
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(quiz => (
              <div key={quiz.id} onClick={() => navigate(`/quiz/${quiz.id}/take`)} className="animate-fade-in">
                <QuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-slate-500 mb-2">No quizzes assigned yet</p>
            <p className="text-sm text-slate-400">Your instructor will assign quizzes here</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
