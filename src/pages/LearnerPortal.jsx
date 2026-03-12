import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import QuizCard from '../components/QuizCard'
import { AlertCircle } from 'lucide-react'

export default function LearnerPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Fetch assignments for this user
        const assignRes = await fetch(`/api/assignments?userId=${user.id}`, {
          credentials: 'include'
        })
        if (!assignRes.ok) throw new Error('Failed to fetch assignments')
        const assignData = await assignRes.json()
        setAssignments(assignData)

        // Fetch quizzes for assigned quiz IDs
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
        setError('Failed to load your quizzes. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Learning Path</h1>
          <p className="text-slate-600">Complete your assigned quizzes to earn certificates</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Quizzes grid */}
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(quiz => (
              <div key={quiz.id} onClick={() => navigate(`/quiz/${quiz.id}/take`)}>
                <QuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-slate-500 mb-2">No quizzes assigned yet</p>
            <p className="text-sm text-slate-400">Your instructor will assign quizzes here</p>
          </div>
        )}
      </div>
    </div>
  )
}
