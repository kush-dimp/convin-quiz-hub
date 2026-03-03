import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

export default function QuizPreview({ quiz, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/quizzes/${quiz.id}/questions`)
        if (res.ok) setQuestions(await res.json())
      } catch (err) {
        console.error('Failed to load questions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [quiz.id])

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold text-slate-900">{quiz.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{quiz.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Info */}
        <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-slate-600">Questions</p>
            <p className="text-lg font-bold text-slate-900">{questions.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Passing Score</p>
            <p className="text-lg font-bold text-slate-900">{quiz.passing_score_pct}%</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Time Limit</p>
            <p className="text-lg font-bold text-slate-900">{quiz.time_limit_mins || '—'} mins</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Status</p>
            <p className={`text-lg font-bold capitalize ${
              quiz.status === 'published' ? 'text-emerald-600' :
              quiz.status === 'draft' ? 'text-slate-600' : 'text-amber-600'
            }`}>{quiz.status}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No questions yet</p>
          ) : (
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Q{idx + 1}. {q.text || q.rich_text?.slice(0, 50)?.replace(/<[^>]*>/g, '')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{q.type} • {q.points} pts</p>
                    </div>
                    {expandedId === q.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedId === q.id && (
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-sm text-slate-700">
                      {q.rich_text ? (
                        <div dangerouslySetInnerHTML={{ __html: q.rich_text }} />
                      ) : (
                        <p>{q.text}</p>
                      )}
                      {q.payload?.options && (
                        <div className="mt-2 space-y-1">
                          {q.payload.options.map((opt, i) => (
                            <p key={i} className="text-xs">• {opt}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}
