import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CertificateRenderer, { CERT_W, CERT_H } from './CertificateRenderer'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function scoreAnswers(questions, userAnswers) {
  let pointsEarned = 0
  let totalPoints = 0

  const enriched = questions.map((q) => {
    const raw = userAnswers[q.id]
    const points = q.points ?? 1
    totalPoints += points

    let isCorrect = false
    let pointsForQ = 0

    const type = q.type

    if (type === 'mcq_single') {
      // correct option is identified by its index into the options array
      const options = q.payload?.options ?? []
      const correctOption = options[q.payload?.correctIndex ?? 0]
      isCorrect = raw !== undefined && raw !== null && raw === correctOption?.id
      pointsForQ = isCorrect ? points : 0
    } else if (type === 'true_false') {
      // correctAnswer is a boolean; userAnswer is stored as string 'true'/'false'
      const correct = q.payload?.correctAnswer
      isCorrect = raw !== undefined && raw !== null && String(raw) === String(correct)
      pointsForQ = isCorrect ? points : 0
    } else if (type === 'mcq_multi') {
      // correctIndices → map to option ids, compare with selected ids
      const options = q.payload?.options ?? []
      const correctIds = (q.payload?.correctIndices ?? [])
        .map(i => options[i]?.id)
        .filter(Boolean)
        .sort()
      const selectedIds = Array.isArray(raw) ? raw.slice().sort() : []
      isCorrect = correctIds.length > 0 && JSON.stringify(correctIds) === JSON.stringify(selectedIds)
      pointsForQ = isCorrect ? points : 0
    } else if (type === 'fill_blank') {
      const correct = q.payload?.correctAnswer ?? ''
      const cs = q.payload?.caseSensitive ?? false
      const answer = raw ?? ''
      isCorrect = answer !== '' && (cs ? answer === correct : answer.toLowerCase() === correct.toLowerCase())
      pointsForQ = isCorrect ? points : 0
    } else {
      // short / essay / matching / ordering / rating / matrix — not auto-graded
      isCorrect = false
      pointsForQ = 0
    }

    pointsEarned += pointsForQ

    return {
      questionId: q.id,
      answer: Array.isArray(raw) ? raw : raw ?? null,
      isCorrect,
      pointsEarned: pointsForQ,
      timeSpent: 0, // we don't track per-question time in this version
    }
  })

  const scorePct = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0

  return { enriched, pointsEarned, totalPoints, scorePct }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OptionCard({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 text-sm font-medium
        ${selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
        }`}
    >
      {children}
    </button>
  )
}

function TrueFalseButtons({ value, onChange }) {
  return (
    <div className="flex gap-4">
      {[true, false].map((bool) => {
        const label = bool ? 'True' : 'False'
        const selected = String(value) === String(bool)
        return (
          <button
            key={label}
            onClick={() => onChange(String(bool))}
            className={`flex-1 py-5 rounded-2xl border-2 text-lg font-semibold transition-all duration-150
              ${selected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
              }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// Multi-choice: toggling individual options
function MultiOptionCard({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 text-sm font-medium flex items-center gap-3
        ${selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
        }`}
    >
      <span className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
        ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white'}`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </button>
  )
}

function ConfirmSubmitModal({ unanswered, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Submit Quiz?</h3>
        {unanswered > 0 ? (
          <p className="text-slate-600 text-sm mb-6">
            You have{' '}
            <span className="font-semibold text-amber-600">{unanswered} unanswered</span>{' '}
            {unanswered === 1 ? 'question' : 'questions'}. You cannot change answers after submitting.
          </p>
        ) : (
          <p className="text-slate-600 text-sm mb-6">
            All questions answered. Are you ready to submit?
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

function RatingSelector({ scale = 5, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-11 h-11 rounded-xl border-2 font-semibold text-sm transition-all
            ${value === n
              ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40'
            }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function MatchingQuestion({ pairs = [], value, onChange }) {
  const matched = value ?? {}
  const rights = pairs.map(p => p.right)
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">Match each item on the left to the correct item on the right.</p>
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium">
            {pair.left}
          </div>
          <span className="text-slate-400 text-sm flex-shrink-0">→</span>
          <select
            value={matched[pair.left] ?? ''}
            onChange={e => onChange({ ...matched, [pair.left]: e.target.value })}
            className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm focus:border-indigo-400 focus:outline-none transition-colors ${
              matched[pair.left] ? 'border-indigo-300 bg-indigo-50/40 text-slate-800' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <option value="">Select...</option>
            {rights.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

function OrderingQuestion({ items = [], value, onChange }) {
  const orderedItems = value ?? [...items]

  function move(idx, dir) {
    const next = [...orderedItems]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 mb-1">Arrange the items in the correct order using the arrows.</p>
      {orderedItems.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700">
            {item}
          </div>
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button onClick={() => move(i, -1)} disabled={i === 0}
              className="w-6 h-5 flex items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors">▲</button>
            <button onClick={() => move(i, 1)} disabled={i === orderedItems.length - 1}
              className="w-6 h-5 flex items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors">▼</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MatrixQuestion({ rows = [], columns = [], value, onChange }) {
  const answers = value ?? {}
  if (!rows.length || !columns.length) {
    return <p className="text-sm text-slate-400 italic">No matrix data available.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="py-2 pr-4 text-left w-1/3" />
            {columns.map(col => (
              <th key={col} className="py-2 px-3 text-center text-xs font-semibold text-slate-600">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row} className={ri % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
              <td className="py-2.5 pr-4 text-sm text-slate-700 font-medium">{row}</td>
              {columns.map(col => (
                <td key={col} className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => onChange({ ...answers, [row]: col })}
                    className={`w-5 h-5 rounded-full border-2 mx-auto block transition-all
                      ${answers[row] === col
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-slate-300 hover:border-indigo-300'
                      }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function QuizTaker() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Data
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempt, setAttempt] = useState(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({}) // { [questionId]: answer }
  const [markedForReview, setMarkedForReview] = useState({}) // { [questionId]: bool }
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Timer
  const [timeLeft, setTimeLeft] = useState(null) // seconds
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Cheat detection
  const [tabSwitches, setTabSwitches] = useState(0)

  // Results
  const [results, setResults] = useState(null) // shown after submit
  const [certificate, setCertificate] = useState(null)
  const [showCertModal, setShowCertModal] = useState(false)

  // ── Visibility / cheat detection ────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setTabSwitches((n) => n + 1)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // ── Load quiz data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !profile) return
    loadQuiz()
  }, [id, profile])

  async function loadQuiz() {
    setLoading(true)
    setError(null)
    try {
      const [quizRes, qRes] = await Promise.all([
        fetch(`/api/quizzes/${id}`),
        fetch(`/api/quizzes/${id}/questions`),
      ])

      if (!quizRes.ok) throw new Error('Failed to load quiz')
      if (!qRes.ok)    throw new Error('Failed to load questions')

      const quizData     = await quizRes.json()
      const questionData = await qRes.json()

      setQuiz(quizData)
      setQuestions(questionData ?? [])

      // Create attempt row (server uses DEMO_USER_ID)
      const attRes = await fetch('/api/results/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id:    id,
          user_id:    profile.id,
          status:     'in_progress',
          started_at: new Date().toISOString(),
        }),
      })
      if (!attRes.ok) throw new Error('Failed to create attempt')
      const newAttempt = await attRes.json()
      setAttempt(newAttempt)

      // Start timer
      if (quizData.time_limit_mins) {
        setTimeLeft(quizData.time_limit_mins * 60)
      }
      startTimeRef.current = Date.now()
    } catch (err) {
      console.error('loadQuiz error:', err)
      setError(err.message ?? 'Failed to load quiz.')
    } finally {
      setLoading(false)
    }
  }

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleAutoSubmit()
      return
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timeLeft])

  // ── Submit logic ──────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    if (!submitting) submitQuiz()
  }, [submitting])

  async function submitQuiz() {
    if (!attempt || !quiz) return
    setSubmitting(true)
    clearTimeout(timerRef.current)

    const totalSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
    const { enriched, pointsEarned, totalPoints, scorePct } = scoreAnswers(questions, userAnswers)
    const passed = scorePct >= (quiz.passing_score_pct ?? 70)

    try {
      // Insert all answers
      if (enriched.length > 0) {
        const ansRes = await fetch(`/api/results/attempts/${attempt.id}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            enriched.map((a) => ({
              question_id:   a.questionId,
              answer:        a.answer,
              is_correct:    a.isCorrect,
              points_earned: a.pointsEarned,
              time_spent_s:  a.timeSpent,
            }))
          ),
        })
        if (!ansRes.ok) throw new Error('Failed to save answers')
      }

      // Update attempt
      const updRes = await fetch(`/api/results/attempts/${attempt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:       'submitted',
          submitted_at: new Date().toISOString(),
          time_taken_s: totalSeconds,
          score_pct:    scorePct,
          points_earned: pointsEarned,
          total_points:  totalPoints,
          passed,
          tab_switches:  tabSwitches,
        }),
      })
      if (!updRes.ok) throw new Error('Failed to update attempt')

      const updData = await updRes.json()
      if (updData.certificate) setCertificate(updData.certificate)
      setResults({ scorePct, passed, totalSeconds, pointsEarned, totalPoints })
    } catch (err) {
      console.error('submitQuiz error:', err)
      setError(err.message ?? 'Failed to submit quiz.')
      setSubmitting(false)
    }
  }

  // ── Answer handlers ───────────────────────────────────────────────────────
  function setAnswer(questionId, value) {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleMultiAnswer(questionId, optionId) {
    setUserAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : []
      const exists = current.includes(optionId)
      return {
        ...prev,
        [questionId]: exists ? current.filter((x) => x !== optionId) : [...current, optionId],
      }
    })
  }

  function toggleMark(questionId) {
    setMarkedForReview((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex] ?? null
  function hasAnswer(a) {
    if (Array.isArray(a)) return a.length > 0
    if (a !== null && typeof a === 'object') return Object.keys(a).length > 0
    return a !== undefined && a !== null && a !== ''
  }
  const answeredCount = questions.filter((q) => hasAnswer(userAnswers[q.id])).length
  const unansweredCount = totalQuestions - answeredCount
  const isLastQuestion = currentIndex === totalQuestions - 1
  const isAnswered = (q) => hasAnswer(userAnswers[q?.id])

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full mx-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M5.07 19H19a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16A2 2 0 005.07 19z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (results) {
    const { scorePct, passed, totalSeconds, pointsEarned, totalPoints } = results
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

    return (
      <>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-lg w-full text-center">
          {/* Score circle */}
          <div className={`w-28 h-28 rounded-full mx-auto mb-6 flex flex-col items-center justify-center border-4
            ${passed ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
            <span className={`text-3xl font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.round(scorePct)}%
            </span>
          </div>

          {/* Pass / Fail badge */}
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold mb-4
            ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {passed ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Passed
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Not Passed
              </>
            )}
          </span>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">{quiz?.title}</h2>
          <p className="text-slate-500 text-sm mb-8">Quiz complete</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-0.5">Score</p>
              <p className="text-lg font-bold text-slate-900">{pointsEarned}/{totalPoints}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-0.5">Time Taken</p>
              <p className="text-lg font-bold text-slate-900">{timeStr}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-0.5">Answered</p>
              <p className="text-lg font-bold text-slate-900">{answeredCount}/{totalQuestions}</p>
            </div>
          </div>

          {/* Certificate section */}
          {certificate && (() => {
            let tpl = {}
            try { tpl = JSON.parse(quiz?.certificate_template || '{}') } catch {}
            const thumbScale = 370 / CERT_W
            const thumbH = Math.round(CERT_H * thumbScale)
            return (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12 12 0 0112 21.5a12 12 0 01-6.16-10.922L12 14z" />
                  </svg>
                  <span className="font-semibold text-slate-900">Certificate Earned!</span>
                </div>
                {/* Thumbnail preview */}
                <div className="relative mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                     style={{ width: 370, height: thumbH }}>
                  <div style={{
                    transform: `scale(${thumbScale})`,
                    transformOrigin: 'top left',
                    width: CERT_W,
                    height: CERT_H,
                    pointerEvents: 'none',
                  }}>
                    <CertificateRenderer
                      cert={certificate}
                      quizTitle={quiz?.title}
                      userName={profile?.name}
                      scorePct={Math.round(scorePct)}
                      template={tpl.template}
                      primaryColor={tpl.primaryColor}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowCertModal(true)}
                  className="mt-4 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
                >
                  View &amp; Download Certificate
                </button>
              </div>
            )
          })()}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => navigate(`/results/${attempt?.id}`)}
              className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm"
            >
              View Detailed Results
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen certificate modal */}
      {showCertModal && certificate && (() => {
        let tpl = {}
        try { tpl = JSON.parse(quiz?.certificate_template || '{}') } catch {}
        const scale = Math.min(
          (window.innerWidth * 0.9) / CERT_W,
          (window.innerHeight * 0.85) / CERT_H,
        )
        return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors shadow"
              >
                Print / Save as PDF
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
              >
                Close
              </button>
            </div>
            <div style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: CERT_W,
              height: CERT_H,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <CertificateRenderer
                cert={certificate}
                quizTitle={quiz?.title}
                userName={profile?.name}
                scorePct={Math.round(scorePct)}
                template={tpl.template}
                primaryColor={tpl.primaryColor}
              />
            </div>
          </div>
        )
      })()}
      </>
    )
  }

  // ── Quiz taking screen ────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No questions found for this quiz.</p>
      </div>
    )
  }

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100
  const isTimeLow = timeLeft !== null && timeLeft < 60

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-slate-900 text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs">
            {quiz?.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress label */}
          <span className="text-xs text-slate-500 font-medium hidden sm:block">
            Q {currentIndex + 1} / {totalQuestions}
          </span>

          {/* Timer */}
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold
              ${isTimeLow ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              {formatTime(timeLeft)}
            </div>
          )}

          {/* Early submit */}
          <button
            onClick={() => setShowConfirm(true)}
            className="hidden sm:block text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            Submit Quiz
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Question card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-4">
            {/* Question header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Q{currentIndex + 1}
                </span>
                <span className="text-xs text-slate-400">
                  {currentQuestion.points ?? 1} {(currentQuestion.points ?? 1) === 1 ? 'pt' : 'pts'}
                </span>
                {currentQuestion.type === 'mcq_multi' && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Select all that apply</span>
                )}
                {currentQuestion.type === 'matching' && (
                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Match the pairs</span>
                )}
                {currentQuestion.type === 'ordering' && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Arrange in order</span>
                )}
                {currentQuestion.type === 'rating' && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Rate 1–{currentQuestion.payload?.scale ?? 5}
                  </span>
                )}
              </div>
              {markedForReview[currentQuestion.id] && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                  Marked for review
                </span>
              )}
            </div>

            {/* Question text */}
            <p className="text-slate-900 text-base sm:text-lg font-medium leading-relaxed mb-6">
              {currentQuestion.text}
            </p>

            {/* Answer options */}
            <div className="space-y-3">
              {currentQuestion.type === 'mcq_single' && (
                (currentQuestion.payload?.options ?? []).map((opt) => (
                  <OptionCard
                    key={opt.id}
                    selected={userAnswers[currentQuestion.id] === opt.id}
                    onClick={() => setAnswer(currentQuestion.id, opt.id)}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold
                        ${userAnswers[currentQuestion.id] === opt.id
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-300 text-slate-400'}`}>
                        {opt.id?.toUpperCase()}
                      </span>
                      {opt.text}
                    </span>
                  </OptionCard>
                ))
              )}

              {currentQuestion.type === 'true_false' && (
                <TrueFalseButtons
                  value={userAnswers[currentQuestion.id]}
                  onChange={(val) => setAnswer(currentQuestion.id, val)}
                />
              )}

              {currentQuestion.type === 'mcq_multi' && (
                (currentQuestion.payload?.options ?? []).map((opt) => {
                  const selected = Array.isArray(userAnswers[currentQuestion.id])
                    ? userAnswers[currentQuestion.id].includes(opt.id)
                    : false
                  return (
                    <MultiOptionCard
                      key={opt.id}
                      selected={selected}
                      onClick={() => toggleMultiAnswer(currentQuestion.id, opt.id)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className={`text-xs font-bold ${selected ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {opt.id?.toUpperCase()}
                        </span>
                        {opt.text}
                      </span>
                    </MultiOptionCard>
                  )
                })
              )}

              {currentQuestion.type === 'fill_blank' && (
                <div>
                  <input
                    type="text"
                    value={userAnswers[currentQuestion.id] ?? ''}
                    onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Type the missing word or phrase..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-800 text-sm transition-colors"
                  />
                </div>
              )}

              {(currentQuestion.type === 'short' || currentQuestion.type === 'essay') && (
                <div>
                  {currentQuestion.type === 'essay' ? (
                    <textarea
                      rows={5}
                      value={userAnswers[currentQuestion.id] ?? ''}
                      onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-800 text-sm resize-none transition-colors"
                    />
                  ) : (
                    <input
                      type="text"
                      value={userAnswers[currentQuestion.id] ?? ''}
                      onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-800 text-sm transition-colors"
                    />
                  )}
                  <p className="mt-2 text-xs text-slate-400">This question will be graded manually.</p>
                </div>
              )}

              {currentQuestion.type === 'rating' && (
                <div>
                  <RatingSelector
                    scale={currentQuestion.payload?.scale ?? 5}
                    value={userAnswers[currentQuestion.id]}
                    onChange={(val) => setAnswer(currentQuestion.id, val)}
                  />
                </div>
              )}

              {currentQuestion.type === 'matching' && (
                <MatchingQuestion
                  pairs={currentQuestion.payload?.pairs ?? []}
                  value={userAnswers[currentQuestion.id]}
                  onChange={(val) => setAnswer(currentQuestion.id, val)}
                />
              )}

              {currentQuestion.type === 'ordering' && (
                <OrderingQuestion
                  items={currentQuestion.payload?.items ?? []}
                  value={userAnswers[currentQuestion.id]}
                  onChange={(val) => setAnswer(currentQuestion.id, val)}
                />
              )}

              {currentQuestion.type === 'matrix' && (
                <MatrixQuestion
                  rows={currentQuestion.payload?.rows ?? []}
                  columns={currentQuestion.payload?.columns ?? []}
                  value={userAnswers[currentQuestion.id]}
                  onChange={(val) => setAnswer(currentQuestion.id, val)}
                />
              )}
            </div>
          </div>

          {/* Question grid dots */}
          <div className="bg-white rounded-2xl shadow-sm px-4 sm:px-6 py-4 mb-4">
            <p className="text-xs text-slate-500 font-medium mb-3">Questions</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const answered = isAnswered(q)
                const marked = markedForReview[q.id]
                const isCurrent = idx === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border-2
                      ${isCurrent
                        ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm'
                        : marked
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : answered
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
                Unanswered
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200 inline-block" />
                Answered
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
                Marked
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom nav bar ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Previous */}
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium
              hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Center: Mark for review */}
          <button
            onClick={() => toggleMark(currentQuestion.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all
              ${markedForReview[currentQuestion.id]
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
              }`}
          >
            <svg className="w-4 h-4" fill={markedForReview[currentQuestion.id] ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">Mark for Review</span>
          </button>

          {/* Next or Submit */}
          {isLastQuestion ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
                text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
                text-white text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </footer>

      {/* ── Confirm submit modal ────────────────────────────────────────── */}
      {showConfirm && (
        <ConfirmSubmitModal
          unanswered={unansweredCount}
          onConfirm={() => {
            setShowConfirm(false)
            submitQuiz()
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
