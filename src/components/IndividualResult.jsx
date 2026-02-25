import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Mail, Clock, Award, MessageSquare, Flag, Check, X, HelpCircle } from 'lucide-react'
import { useResult } from '../hooks/useResults'

function ScoreGauge({ score }) {
  const r = 52, c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="transform -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{score}%</span>
        <span className={`text-xs font-semibold ${score >= 70 ? 'text-green-600' : 'text-red-500'}`}>{score >= 70 ? 'PASSED' : 'FAILED'}</span>
      </div>
    </div>
  )
}

function QuestionRow({ q, i, answer }) {
  const isCorrect = answer.is_correct
  const questionText = answer.questions?.text || 'Question text unavailable'
  const explanation = answer.questions?.explanation
  const points = answer.questions?.points ?? 10
  const pointsEarned = answer.points_earned ?? (isCorrect ? points : 0)
  const timeSpent = answer.time_spent_s ?? 0
  const payload = answer.questions?.payload || {}
  const options = payload.options || []
  const correctIndex = payload.correctIndex
  const userAnswerIndex = typeof answer.answer === 'number' ? answer.answer : (
    typeof answer.answer === 'string' && !isNaN(+answer.answer) ? +answer.answer : null
  )

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
      <div className={`flex items-center gap-3 px-4 py-2.5 ${isCorrect ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {isCorrect ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
        <span className="text-xs font-bold text-slate-600">Q{i+1}</span>
        <span className={`text-xs font-medium flex-1 ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>{isCorrect ? 'Correct' : 'Incorrect'}</span>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeSpent}s</span>
          <span className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>{pointsEarned}/{points} pts</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-slate-800 font-medium">{questionText}</p>
        {options.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {options.map((o, idx) => (
              <div key={idx} className={`text-xs px-3 py-1.5 rounded-lg border ${
                idx === correctIndex
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                  : idx === userAnswerIndex
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-slate-100 text-slate-500'
              }`}>
                {idx === userAnswerIndex && idx !== correctIndex ? '✗ ' : idx === correctIndex ? '✓ ' : ''}{o}
              </div>
            ))}
          </div>
        )}
        {explanation && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <MessageSquare className="w-3 h-3 inline mr-1" /> {explanation}
          </div>
        )}
      </div>
    </div>
  )
}

export default function IndividualResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { attempt, answers, loading } = useResult(id)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading result…</p>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Result not found.</p>
      </div>
    )
  }

  const userName = attempt.profiles?.name || 'Unknown'
  const email = attempt.profiles?.email || ''
  const quizTitle = attempt.quizzes?.title || 'Quiz'
  const score = Math.round(attempt.score_pct ?? 0)
  const passed = attempt.passed ?? false
  const timeTaken = formatTime(attempt.time_taken_s)
  const submittedAt = attempt.submitted_at
  const attemptNumber = attempt.attempt_number ?? 1
  const pointsEarned = attempt.points_earned ?? 0
  const totalPoints = attempt.total_points ?? 0

  const initials = userName.split(' ').map(n => n[0]).join('')
  const correctCount = answers.filter(a => a.is_correct).length
  const wrongCount = answers.filter(a => !a.is_correct).length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-6 h-[56px] flex items-center gap-4">
          <button onClick={() => navigate('/results')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Results
          </button>
          <div className="flex-1">
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-none">Result Detail</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Detailed attempt review</p>
            </div>
          </div>
          <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium shadow-sm flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email Results</button>
          <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium shadow-sm flex items-center gap-1.5"><Download className="w-4 h-4" /> Download PDF</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* User + overview */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-base font-bold text-indigo-600 flex-shrink-0">{initials}</div>
              <div>
                <h2 className="font-bold text-slate-900">{userName}</h2>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
            </div>
            <div className="space-y-0 text-sm">
              {[
                ['Date / Time', submittedAt ? new Date(submittedAt).toLocaleString() : '—'],
                ['Time Taken',  timeTaken],
                ['Attempt',     `#${attemptNumber}`],
                ['Points',      `${pointsEarned} / ${totalPoints}`],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center">
            <ScoreGauge score={score} />
            <div className="flex gap-4 mt-4 text-center">
              <div><p className="text-xs text-slate-400">Correct</p><p className="text-lg font-bold text-green-600">{correctCount}</p></div>
              <div><p className="text-xs text-slate-400">Wrong</p><p className="text-lg font-bold text-red-500">{wrongCount}</p></div>
              <div><p className="text-xs text-slate-400">Total</p><p className="text-lg font-bold text-slate-700">{answers.length}</p></div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Better than <span className="font-semibold text-indigo-600">{Math.round(score * 0.6)}%</span> of participants
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Score Comparison</h3>
          <div className="space-y-2">
            {[['This attempt', score, 'bg-indigo-500'], ['Class average', 74, 'bg-slate-300'], ['Top score', 97, 'bg-emerald-500']].map(([label, val, color]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28">{label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${val}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-10 text-right">{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question review */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Question-by-Question Review</h3>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <QuestionRow key={a.question_id ?? i} q={a.questions} i={i} answer={a} />
            ))}
          </div>
        </div>

        {/* Instructor notes */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-400" /> Instructor Notes</h3>
          <textarea rows={3} placeholder="Add private notes or comments for this submission…" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none" />
          <button className="mt-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-indigo-200">Save Note</button>
        </div>
      </main>
    </div>
  )
}

function formatTime(secs) {
  if (!secs) return '0m 0s'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}
