import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
      const correct = q.payload?.correct
      isCorrect = raw !== undefined && raw !== null && raw === correct
      pointsForQ = isCorrect ? points : 0
    } else if (type === 'true_false') {
      const correct = q.payload?.correct // boolean
      // userAnswer stored as string 'true' or 'false'
      isCorrect = raw !== undefined && raw !== null && String(raw) === String(correct)
      pointsForQ = isCorrect ? points : 0
    } else if (type === 'mcq_multi') {
      const correct = (q.payload?.correct ?? []).slice().sort()
      const selected = Array.isArray(raw) ? raw.slice().sort() : []
      isCorrect = JSON.stringify(correct) === JSON.stringify(selected)
      pointsForQ = isCorrect ? points : 0
    } else {
      // short / essay — not auto-graded
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
      const [{ data: quizData, error: quizErr }, { data: questionData, error: qErr }] =
        await Promise.all([
          supabase.from('quizzes').select('*').eq('id', id).single(),
          supabase.from('questions').select('*').eq('quiz_id', id).order('position'),
        ])

      if (quizErr) throw quizErr
      if (qErr) throw qErr

      setQuiz(quizData)
      setQuestions(questionData ?? [])

      // Determine attempt number
      const { count } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', id)
        .eq('user_id', profile.id)

      const attemptNumber = (count ?? 0) + 1

      // Create attempt row
      const { data: newAttempt, error: attErr } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: id,
          user_id: profile.id,
          attempt_number: attemptNumber,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (attErr) throw attErr
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
        const { error: ansErr } = await supabase.from('attempt_answers').insert(
          enriched.map((a) => ({
            attempt_id: attempt.id,
            question_id: a.questionId,
            answer: a.answer,
            is_correct: a.isCorrect,
            points_earned: a.pointsEarned,
            time_spent_s: a.timeSpent,
          }))
        )
        if (ansErr) throw ansErr
      }

      // Update attempt
      const { error: updErr } = await supabase
        .from('quiz_attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          time_taken_s: totalSeconds,
          score_pct: scorePct,
          points_earned: pointsEarned,
          total_points: totalPoints,
          passed,
          tab_switches: tabSwitches,
        })
        .eq('id', attempt.id)

      if (updErr) throw updErr

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
  const answeredCount = questions.filter((q) => {
    const a = userAnswers[q.id]
    if (Array.isArray(a)) return a.length > 0
    return a !== undefined && a !== null && a !== ''
  }).length
  const unansweredCount = totalQuestions - answeredCount
  const isLastQuestion = currentIndex === totalQuestions - 1
  const isAnswered = (q) => {
    const a = userAnswers[q?.id]
    if (Array.isArray(a)) return a.length > 0
    return a !== undefined && a !== null && a !== ''
  }

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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
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
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Select all that apply
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
