import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const ANSWER_COLORS = [
  { base: 'bg-indigo-500 hover:bg-indigo-600',   reveal: 'bg-emerald-500', dim: 'bg-slate-300' },
  { base: 'bg-violet-500 hover:bg-violet-600',   reveal: 'bg-emerald-500', dim: 'bg-slate-300' },
  { base: 'bg-amber-500  hover:bg-amber-600',    reveal: 'bg-emerald-500', dim: 'bg-slate-300' },
  { base: 'bg-rose-500   hover:bg-rose-600',     reveal: 'bg-emerald-500', dim: 'bg-slate-300' },
]

const ANSWER_LABELS = ['A', 'B', 'C', 'D']

export default function LiveSessionJoin() {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('join') // join | waiting | quiz | ended
  const [code, setCode] = useState(urlCode?.toUpperCase() || '')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // Quiz runtime state
  const [myName, setMyName] = useState('')
  const [myScore, setMyScore] = useState(0)
  const [roomCode, setRoomCode] = useState('')
  const [currentQ, setCurrentQ] = useState(null) // { question, answers, index, total }
  const [timer, setTimer] = useState(15)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [revealCorrect, setRevealCorrect] = useState(null)

  // End screen
  const [finalLeaderboard, setFinalLeaderboard] = useState([])

  const socketRef = useRef(null)

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || '/'
    const socket = io(url, { autoConnect: false })
    socketRef.current = socket
    socket.connect()

    socket.on('joined_room', ({ code: c, name: n, score: s, isRunning, currentQuestion }) => {
      setMyName(n)
      setMyScore(s)
      setRoomCode(c)
      setError('')
      if (isRunning && currentQuestion) {
        setCurrentQ({
          question: currentQuestion.question,
          answers: currentQuestion.answers,
          index: currentQuestion.index,
          total: currentQuestion.total,
        })
        setTimer(currentQuestion.timer)
        setSelectedAnswer(null)
        setRevealCorrect(null)
        setPhase('quiz')
      } else {
        setPhase('waiting')
      }
    })

    socket.on('join_error', ({ message }) => {
      setError(message)
    })

    socket.on('quiz_started', ({ question, answers, index, total }) => {
      setCurrentQ({ question, answers, index, total })
      setTimer(15)
      setSelectedAnswer(null)
      setRevealCorrect(null)
      setPhase('quiz')
    })

    socket.on('question_update', ({ question, answers, index, total, timer: t }) => {
      setCurrentQ({ question, answers, index, total })
      setTimer(t ?? 15)
      setSelectedAnswer(null)
      setRevealCorrect(null)
    })

    socket.on('timer_tick', ({ time }) => setTimer(time))

    socket.on('reveal_answer', ({ correct }) => setRevealCorrect(correct))

    socket.on('score_update', ({ score }) => setMyScore(score))

    socket.on('quiz_ended', ({ leaderboard }) => {
      setFinalLeaderboard(leaderboard)
      setPhase('ended')
    })

    socket.on('room_closed', () => {
      setError('The host ended the session.')
      setPhase('join')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  function joinRoom() {
    const trimCode = code.trim().toUpperCase()
    const trimName = name.trim()
    if (!trimCode || !trimName) {
      setError('Please enter both a room code and your name.')
      return
    }
    setError('')
    socketRef.current?.emit('join_room', { code: trimCode, name: trimName })
  }

  function selectAnswer(index) {
    if (selectedAnswer !== null || revealCorrect !== null) return
    setSelectedAnswer(index)
    socketRef.current?.emit('select_answer', { code: roomCode, index })
  }

  function playAgain() {
    setPhase('join')
    setCode(urlCode?.toUpperCase() || '')
    setName('')
    setError('')
    setMyName('')
    setMyScore(0)
    setRoomCode('')
    setCurrentQ(null)
    setTimer(15)
    setSelectedAnswer(null)
    setRevealCorrect(null)
    setFinalLeaderboard([])
    // Reconnect socket
    socketRef.current?.disconnect()
    const url = import.meta.env.VITE_SOCKET_URL || '/'
    const socket = io(url, { autoConnect: false })
    socketRef.current = socket
    socket.connect()
    socket.on('joined_room', ({ code: c, name: n, score: s, isRunning, currentQuestion }) => {
      setMyName(n); setMyScore(s); setRoomCode(c); setError('')
      if (isRunning && currentQuestion) {
        setCurrentQ({ question: currentQuestion.question, answers: currentQuestion.answers, index: currentQuestion.index, total: currentQuestion.total })
        setTimer(currentQuestion.timer); setSelectedAnswer(null); setRevealCorrect(null); setPhase('quiz')
      } else { setPhase('waiting') }
    })
    socket.on('join_error', ({ message }) => setError(message))
    socket.on('quiz_started', ({ question, answers, index, total }) => {
      setCurrentQ({ question, answers, index, total }); setTimer(15); setSelectedAnswer(null); setRevealCorrect(null); setPhase('quiz')
    })
    socket.on('question_update', ({ question, answers, index, total, timer: t }) => {
      setCurrentQ({ question, answers, index, total }); setTimer(t ?? 15); setSelectedAnswer(null); setRevealCorrect(null)
    })
    socket.on('timer_tick', ({ time }) => setTimer(time))
    socket.on('reveal_answer', ({ correct }) => setRevealCorrect(correct))
    socket.on('score_update', ({ score }) => setMyScore(score))
    socket.on('quiz_ended', ({ leaderboard }) => { setFinalLeaderboard(leaderboard); setPhase('ended') })
    socket.on('room_closed', () => { setError('The host ended the session.'); setPhase('join') })
  }

  // ─── Phase: join ─────────────────────────────────────────────────────────
  if (phase === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <h1 className="text-2xl font-bold text-slate-900">Join Quiz</h1>
            <p className="text-slate-500 text-sm mt-1">Enter the room code and your name</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Room Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] uppercase focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                placeholder="Enter your name"
                maxLength={32}
                className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={joinRoom}
            disabled={!code.trim() || !name.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Session →
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            Back to app
          </button>
        </div>
      </div>
    )
  }

  // ─── Phase: waiting ───────────────────────────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm text-center space-y-5">
          <div className="text-5xl animate-bounce">⏳</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">You're in!</h2>
            <p className="text-slate-500 text-sm mt-1">Waiting for the host to start the quiz...</p>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-4">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-1">Room</p>
            <p className="text-3xl font-bold text-indigo-700 tracking-widest">{roomCode}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Playing as</p>
            <p className="text-lg font-bold text-slate-800">{myName}</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Phase: quiz ──────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const timerPct = timer / 15
    const radius = 22
    const circumference = 2 * Math.PI * radius
    const dash = timerPct * circumference

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="text-slate-400 text-sm font-medium">
            Q {(currentQ?.index ?? 0) + 1} / {currentQ?.total ?? '?'}
          </div>

          {/* Timer circle */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="26" cy="26" r={radius}
                fill="none"
                stroke={timer <= 5 ? '#ef4444' : '#818cf8'}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - dash}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`relative text-lg font-bold tabular-nums ${timer <= 5 ? 'text-red-400' : 'text-white'}`}>
              {timer}
            </span>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Score</p>
            <p className="text-lg font-bold text-indigo-300 tabular-nums">{myScore}</p>
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-white text-xl font-bold leading-snug text-center">
              {currentQ?.question}
            </p>
          </div>
        </div>

        {/* Answers 2×2 grid */}
        <div className="flex-1 px-6 pb-8 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
            {currentQ?.answers.map((ans, ai) => {
              const isSelected = selectedAnswer === ai
              const isCorrect = revealCorrect === ai
              const isWrong = revealCorrect !== null && !isCorrect

              let colorClass = ANSWER_COLORS[ai].base
              if (revealCorrect !== null) {
                colorClass = isCorrect
                  ? 'bg-emerald-500'
                  : isSelected
                    ? 'bg-red-500'
                    : 'bg-slate-600 opacity-60'
              } else if (isSelected) {
                colorClass = 'bg-indigo-400 ring-4 ring-white/50'
              }

              return (
                <button
                  key={ai}
                  onClick={() => selectAnswer(ai)}
                  disabled={selectedAnswer !== null || revealCorrect !== null}
                  className={`
                    relative rounded-2xl p-4 text-white font-semibold text-sm
                    transition-all duration-300 min-h-[80px] flex flex-col items-center justify-center gap-2
                    disabled:cursor-default
                    ${colorClass}
                  `}
                >
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${revealCorrect !== null && isCorrect ? 'bg-white/30' : 'bg-black/20'}
                  `}>
                    {ANSWER_LABELS[ai]}
                  </span>
                  <span className="leading-snug text-center">{ans}</span>
                  {revealCorrect !== null && isCorrect && (
                    <span className="absolute top-2 right-2 text-lg">✓</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedAnswer !== null && revealCorrect === null && (
            <p className="text-center text-slate-400 text-sm mt-4 animate-pulse">
              Answer locked in! Waiting for reveal...
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Phase: ended ─────────────────────────────────────────────────────────
  if (phase === 'ended') {
    const myRank = finalLeaderboard.findIndex(p => p.name === myName)

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="text-5xl mb-2">
              {myRank === 0 ? '🥇' : myRank === 1 ? '🥈' : myRank === 2 ? '🥉' : '🎉'}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Quiz Over!</h2>
            <p className="text-slate-500 text-sm mt-1">
              {myRank >= 0
                ? `You finished #${myRank + 1} with ${myScore} points`
                : `Final score: ${myScore} points`}
            </p>
          </div>

          {/* Mini leaderboard (top 5) */}
          <div className="bg-slate-50 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Leaderboard</p>
            </div>
            {finalLeaderboard.slice(0, 5).map((p, i) => {
              const isSelf = p.name === myName
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < finalLeaderboard.slice(0, 5).length - 1 ? 'border-b border-slate-200' : ''
                  } ${isSelf ? 'bg-indigo-50' : ''}`}
                >
                  <span className="text-sm font-bold text-slate-400 w-5 flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <span className={`flex-1 text-sm font-medium truncate ${isSelf ? 'text-indigo-700 font-bold' : 'text-slate-700'}`}>
                    {p.name} {isSelf && '(you)'}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${isSelf ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {p.score}
                  </span>
                </div>
              )
            })}
            {finalLeaderboard.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No scores yet</div>
            )}
          </div>

          <button
            onClick={playAgain}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md"
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return null
}
