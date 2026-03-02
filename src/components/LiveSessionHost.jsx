import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  Radio, Plus, Trash2, Copy, Check, Play,
  SkipForward, Square, Users,
} from 'lucide-react'

// ─── QuestionBuilderItem ──────────────────────────────────────────────────────
// Internal component — not exported
function QuestionBuilderItem({ q, index, onChange, onDelete, canDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-2.5 text-sm font-bold text-slate-400 w-5 flex-shrink-0">
          {index + 1}.
        </span>

        <div className="flex-1 space-y-3 min-w-0">
          <input
            type="text"
            placeholder="Question text…"
            value={q.question}
            onChange={e => onChange(index, 'question', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
          />

          <div className="grid grid-cols-2 gap-2">
            {q.answers.map((ans, ai) => (
              <div
                key={ai}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  q.correct === ai
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onChange(index, 'correct', ai)}
                  title="Mark as correct answer"
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                    q.correct === ai
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-300 hover:border-emerald-400'
                  }`}
                />
                <input
                  type="text"
                  placeholder={`Option ${ai + 1}`}
                  value={ans}
                  onChange={e => {
                    const newAnswers = [...q.answers]
                    newAnswers[ai] = e.target.value
                    onChange(index, 'answers', newAnswers)
                  }}
                  className="flex-1 bg-transparent text-sm focus:outline-none min-w-0 text-slate-700"
                />
              </div>
            ))}
          </div>
        </div>

        {canDelete && (
          <button
            onClick={() => onDelete(index)}
            className="mt-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ANSWER_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
]

function emptyQuestion() {
  return { question: '', answers: ['', '', '', ''], correct: 0 }
}

function createSocket() {
  const url = import.meta.env.VITE_SOCKET_URL || '/'
  const socket = io(url, { autoConnect: false })
  socket.connect()
  return socket
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveSessionHost() {
  // sessionKey increments on "New Session" to trigger socket reconnect via useEffect
  const [sessionKey, setSessionKey] = useState(0)

  const [phase, setPhase] = useState('idle') // idle | setup | lobby | running | ended
  const [code, setCode] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [participants, setParticipants] = useState([])
  const [currentQ, setCurrentQ] = useState(null) // { question, answers, index, total }
  const [timer, setTimer] = useState(15)
  const [responses, setResponses] = useState([0, 0, 0, 0])
  const [revealCorrect, setRevealCorrect] = useState(null) // null | number
  const [leaderboard, setLeaderboard] = useState([])
  const [copied, setCopied] = useState(false)

  const socketRef = useRef(null)

  useEffect(() => {
    const socket = createSocket()
    socketRef.current = socket

    socket.on('room_created', ({ code: c }) => {
      setCode(c)
      setPhase('setup')
    })

    socket.on('participant_joined', ({ participants: p }) => {
      setParticipants(p)
    })

    socket.on('quiz_started', ({ question, answers, index, total, participants: p }) => {
      setParticipants(p)
      setCurrentQ({ question, answers, index, total })
      setTimer(15)
      setResponses([0, 0, 0, 0])
      setRevealCorrect(null)
      setPhase('running')
    })

    socket.on('question_update', ({ question, answers, index, total }) => {
      setCurrentQ({ question, answers, index, total })
      setTimer(15)
      setResponses([0, 0, 0, 0])
      setRevealCorrect(null)
    })

    socket.on('timer_tick', ({ time }) => setTimer(time))

    socket.on('reveal_answer', ({ correct }) => setRevealCorrect(correct))

    socket.on('responses_update', ({ responses: r }) => setResponses(r))

    socket.on('quiz_ended', ({ leaderboard: lb }) => {
      setLeaderboard(lb)
      setPhase('ended')
    })

    socket.on('room_closed', () => {
      setPhase('idle')
      setCode('')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionKey])

  // ── Actions ─────────────────────────────────────────────────────────────
  function createRoom() {
    socketRef.current?.emit('create_room')
  }

  function openLobby() {
    const filled = questions.filter(
      q => q.question.trim() && q.answers.every(a => a.trim())
    )
    if (filled.length > 0) {
      socketRef.current?.emit('set_questions', { code, questions: filled })
    }
    setPhase('lobby')
  }

  function startQuiz() {
    socketRef.current?.emit('start_quiz', { code })
  }

  function nextQuestion() {
    socketRef.current?.emit('next_question', { code })
  }

  function endQuiz() {
    socketRef.current?.emit('end_quiz', { code })
  }

  function newSession() {
    setPhase('idle')
    setCode('')
    setQuestions([emptyQuestion()])
    setParticipants([])
    setCurrentQ(null)
    setTimer(15)
    setResponses([0, 0, 0, 0])
    setRevealCorrect(null)
    setLeaderboard([])
    setCopied(false)
    setSessionKey(k => k + 1) // triggers useEffect cleanup + reconnect
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function updateQuestion(i, field, value) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function addQuestion() {
    setQuestions(prev => [...prev, emptyQuestion()])
  }

  function deleteQuestion(i) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
  }

  // ─── Room code banner (reused in setup + lobby) ────────────────────────────
  function CodeBanner() {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-1">
            Room Code
          </p>
          <p className="text-4xl font-bold tracking-[0.25em]">{code}</p>
          <p className="text-indigo-200 text-xs mt-1.5">
            {window.location.origin}/join/{code}
          </p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    )
  }

  // ─── Phase: idle ──────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Live Session</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Create a real-time quiz session for your participants. They join via a shareable code — no account needed.
            </p>
          </div>
          <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-semibold text-center transition-all shadow-sm" title="Coming soon">
            <span>🚀 Amazing features coming soon!</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── Phase: setup ─────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-8 space-y-6">
          <CodeBanner />

          {/* Question builder */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900">Questions</h2>
              <span className="text-xs text-slate-400">
                Leave all blank to use 5 sample questions
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((q, i) => (
                <QuestionBuilderItem
                  key={i}
                  q={q}
                  index={i}
                  onChange={updateQuestion}
                  onDelete={deleteQuestion}
                  canDelete={questions.length > 1}
                />
              ))}
            </div>

            <button
              onClick={addQuestion}
              className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={openLobby}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md"
            >
              Open Lobby →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Phase: lobby ─────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <CodeBanner />

          {/* Participants list */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-slate-900">Participants</h2>
              <span className="ml-auto text-sm text-slate-400">{participants.length} joined</span>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-sm">Waiting for participants to join…</p>
                <p className="text-xs mt-1">Share the code or link above</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={newSession}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startQuiz}
              disabled={participants.length === 0}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Phase: running ───────────────────────────────────────────────────────
  if (phase === 'running') {
    const totalResponses = responses.reduce((a, b) => a + b, 0)

    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Progress + timer header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-slate-600">
                Question {(currentQ?.index ?? 0) + 1} of {currentQ?.total ?? '?'}
              </span>
              <div className="w-48 bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(((currentQ?.index ?? 0) + 1) / (currentQ?.total ?? 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold tabular-nums ${timer <= 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                {timer}s
              </div>
              <button
                onClick={endQuiz}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                End
              </button>
            </div>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-xl font-bold text-slate-900 leading-snug">{currentQ?.question}</p>
          </div>

          {/* Answer tiles with response bars */}
          <div className="grid grid-cols-2 gap-4">
            {currentQ?.answers.map((ans, ai) => {
              const count = responses[ai]
              const pct = totalResponses > 0 ? (count / totalResponses) * 100 : 0
              const isCorrect = revealCorrect === ai

              return (
                <div
                  key={ai}
                  className={`relative overflow-hidden rounded-2xl p-5 transition-colors duration-500 ${
                    revealCorrect !== null
                      ? isCorrect
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                      : `${ANSWER_COLORS[ai]} text-white`
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-sm leading-snug pr-2">{ans}</span>
                    <span className="text-lg font-bold opacity-90 flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs opacity-75 mt-1.5">{Math.round(pct)}%</div>
                </div>
              )
            })}
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>
                {totalResponses} / {participants.length} answered
              </span>
            </div>
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md"
            >
              <SkipForward className="w-4 h-4" />
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Phase: ended ─────────────────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-2xl font-bold text-slate-900">Quiz Complete!</h1>
            <p className="text-slate-500 mt-1 text-sm">Final leaderboard for room {code}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {leaderboard.slice(0, 10).map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i < Math.min(leaderboard.length, 10) - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0
                      ? 'bg-amber-100 text-amber-700'
                      : i === 1
                        ? 'bg-slate-100 text-slate-600'
                        : i === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <span className="flex-1 font-semibold text-slate-900 truncate">{p.name}</span>
                <span className="font-bold text-indigo-600 tabular-nums">{p.score}</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No participants completed the quiz</div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={newSession}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md"
            >
              New Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
