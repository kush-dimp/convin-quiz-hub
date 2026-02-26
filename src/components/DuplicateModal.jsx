import { useState, useRef, useEffect } from 'react'
import {
  X, Copy, CheckCircle2, AlertCircle,
  FolderOpen, Settings, HelpCircle, BarChart2,
  Loader2, ChevronRight,
} from 'lucide-react'

const FOLDERS = ['My Quizzes', 'Technology', 'HR & Compliance', 'Onboarding', 'Certifications', 'General']
const CHUNK_SIZE = 20

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

/* ── Toggle switch ─────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
        checked ? 'bg-[#E63E6D]' : 'bg-gray-300'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/* ── Option row ────────────────────────────────────────────── */
function OptionRow({ icon: Icon, label, description, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
      checked && !disabled ? 'border-[#FFB3C6] bg-[#FFF5F7]/50' : 'border-gray-200 hover:border-gray-300 bg-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        checked ? 'bg-[#FFE5EC] text-[#E63E6D]' : 'bg-gray-100 text-gray-400'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </label>
  )
}

/* ── Main modal ────────────────────────────────────────────── */
export default function DuplicateModal({ quiz, onClose, onSuccess }) {
  const questionCount = ((quiz.id * 7 + 13) % 150) + 10  // deterministic, 10–159

  const [title,   setTitle]   = useState(`Copy of ${quiz.title}`)
  const [opts,    setOpts]    = useState({ settings: true, questions: true, reports: false })
  const [folder,  setFolder]  = useState('My Quizzes')
  const [phase,   setPhase]   = useState('idle')   // idle | processing | success | error
  const [prog,    setProg]    = useState({ label: '', detail: '', pct: 0 })
  const [errMsg,  setErrMsg]  = useState('')
  const [result,  setResult]  = useState(null)
  const attemptRef = useRef(0)

  async function runDuplication() {
    const isRetry = attemptRef.current > 0
    attemptRef.current += 1
    setPhase('processing')
    setProg({ label: '', detail: '', pct: 0 })
    setErrMsg('')

    try {
      // ── Step 1: settings ──────────────────────────────────
      if (opts.settings) {
        setProg({ label: 'Copying quiz settings…', detail: 'Timing, attempts, access controls', pct: 5 })
        await sleep(450)
      }

      // ── Step 2: questions (chunked) ───────────────────────
      if (opts.questions) {
        const totalChunks = Math.ceil(questionCount / CHUNK_SIZE)
        for (let i = 0; i < totalChunks; i++) {
          const done = Math.min((i + 1) * CHUNK_SIZE, questionCount)
          setProg({
            label:  'Duplicating questions…',
            detail: `Chunk ${i + 1} of ${totalChunks} · ${done}/${questionCount} questions`,
            pct:    Math.round(10 + ((i + 1) / totalChunks) * 70),
          })
          await sleep(260 + Math.random() * 180)

          // Simulate error: first attempt + large quiz + chunk 3
          if (!isRetry && questionCount > 90 && i === 2) {
            throw new Error(
              `Network timeout on chunk ${i + 1} of ${totalChunks}. ` +
              `${done} of ${questionCount} questions were copied.`
            )
          }
        }
      }

      // ── Step 3: reports ───────────────────────────────────
      if (opts.reports) {
        setProg({ label: 'Copying reports & results…', detail: 'Importing historical data', pct: 87 })
        await sleep(420)
      }

      // ── Step 4: finalize ──────────────────────────────────
      setProg({ label: 'Finalising…', detail: 'Creating your new quiz', pct: 96 })
      await sleep(280)
      setProg({ label: 'Done!', detail: '', pct: 100 })
      await sleep(150)

      const newQuiz = {
        ...quiz,
        id:        Date.now(),
        title,
        folder,
        status:    'draft',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        stats:     opts.reports
          ? { ...quiz.stats }
          : { views: 0, previews: 0, reports: 0 },
      }

      setResult(newQuiz)
      setPhase('success')
    } catch (err) {
      setErrMsg(err.message)
      setPhase('error')
    }
  }

  function handleSuccess() {
    onSuccess(result)
    onClose()
  }

  /* ── Backdrop click ── */
  function handleBackdrop(e) {
    if (phase === 'processing') return
    if (e.target === e.currentTarget) onClose()
  }

  /* ── Render phases ── */
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── IDLE: options form ── */}
        {phase === 'idle' && (
          <>
            <div className="flex items-center gap-3 px-6 py-5 bg-[#FFF5F7] border-b border-[#FFE5EC]">
              <div className="w-9 h-9 bg-[#E63E6D] rounded-xl flex items-center justify-center flex-shrink-0">
                <Copy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-base font-bold text-gray-900">Duplicate Quiz</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">"{quiz.title}"</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  New Quiz Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 focus:border-[#FF6B9D] text-gray-900"
                />
              </div>

              {/* Duplication options */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">What to duplicate</p>
                <div className="space-y-2">
                  <OptionRow
                    icon={Settings}
                    label="Quiz Settings"
                    description="Timing, attempts, access controls, grading"
                    checked={opts.settings}
                    onChange={(v) => setOpts((p) => ({ ...p, settings: v }))}
                  />
                  <OptionRow
                    icon={HelpCircle}
                    label={`Questions (${questionCount})`}
                    description={`All ${questionCount} questions will be copied`}
                    checked={opts.questions}
                    onChange={(v) => setOpts((p) => ({ ...p, questions: v }))}
                  />
                  <OptionRow
                    icon={BarChart2}
                    label="Reports & Results"
                    description="Copy historical attempt data (starts fresh if off)"
                    checked={opts.reports}
                    onChange={(v) => setOpts((p) => ({ ...p, reports: v }))}
                  />
                </div>
              </div>

              {/* Destination folder */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Destination Folder</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {FOLDERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFolder(f)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                        folder === f
                          ? 'border-[#FF6B9D] bg-[#FFF5F7] text-[#C41E5C] font-semibold'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 ${folder === f ? 'text-[#FF6B9D]' : 'text-gray-400'}`} />
                      <span className="truncate text-xs">{f}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Large quiz warning */}
              {questionCount > 90 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ This quiz has {questionCount} questions and will be duplicated in chunks of {CHUNK_SIZE}.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={runDuplication}
                disabled={!title.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E63E6D] hover:bg-[#C41E5C] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Duplicate Quiz
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── PROCESSING: progress ── */}
        {phase === 'processing' && (
          <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#FFE5EC] flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-[#E63E6D] animate-spin" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {prog.label || 'Starting duplication…'}
              </p>
              {prog.detail && (
                <p className="text-sm text-gray-500 mt-1">{prog.detail}</p>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-[#E63E6D]">{prog.pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF6B9D] rounded-full transition-all duration-300"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
            </div>

            {questionCount > 90 && (
              <p className="text-xs text-gray-400">
                Processing in chunks of {CHUNK_SIZE} for reliability
              </p>
            )}
          </div>
        )}

        {/* ── SUCCESS ── */}
        {phase === 'success' && result && (
          <>
            <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Quiz duplicated!</p>
                <p className="text-sm text-gray-500 mt-1.5 max-w-xs">
                  <span className="font-semibold text-gray-700">"{result.title}"</span> was created
                  {opts.questions && ` with ${questionCount} questions`}
                  {folder !== 'My Quizzes' && ` in ${folder}`}.
                </p>
              </div>

              <div className="w-full bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-left space-y-1.5 text-xs text-gray-600">
                <Row label="Title"    value={result.title} />
                <Row label="Status"   value="Draft" />
                <Row label="Folder"   value={folder} />
                <Row label="Questions" value={opts.questions ? `${questionCount} copied` : 'Not copied'} />
                <Row label="Reports"  value={opts.reports ? 'Copied' : 'Fresh start'} />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 pb-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSuccess}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#E63E6D] bg-[#FFF5F7] hover:bg-[#FFE5EC] rounded-lg transition-colors"
              >
                View Quiz
              </button>
              <button
                onClick={handleSuccess}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E63E6D] hover:bg-[#C41E5C] rounded-lg transition-colors"
              >
                Edit Quiz
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <>
            <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Duplication failed</p>
                <p className="text-sm text-gray-500 mt-1.5 max-w-xs">
                  An error occurred during duplication.
                </p>
              </div>

              <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
                <p className="text-xs font-semibold text-red-700 mb-1">Error details</p>
                <p className="text-xs text-red-600 font-mono break-words">{errMsg}</p>
              </div>

              <p className="text-xs text-gray-400">
                Retrying will resume from where it left off.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={runDuplication}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E63E6D] hover:bg-[#C41E5C] rounded-lg transition-colors"
              >
                Retry
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 truncate">{value}</span>
    </div>
  )
}
