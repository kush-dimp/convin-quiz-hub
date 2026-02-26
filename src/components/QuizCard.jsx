import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Play, BarChart2, Lock, MoreVertical,
  Pencil, Copy, Share2, Trash2, Timer, Check, History,
} from 'lucide-react'

const STATUS_STYLES = {
  published: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  draft:     'bg-slate-500/20    text-slate-300   border-slate-500/20',
  archived:  'bg-amber-500/20    text-amber-300   border-amber-500/30',
}

/* gradient placeholder bg per category */
const GRAD = [
  'from-indigo-500/20 to-violet-600/20',
  'from-blue-500/20 to-cyan-600/20',
  'from-violet-500/20 to-pink-600/20',
  'from-rose-500/20 to-orange-600/20',
  'from-teal-500/20 to-emerald-600/20',
  'from-amber-500/20 to-yellow-600/20',
]
function gradFor(id) { return GRAD[id % GRAD.length] }

function CardPlaceholder({ quizId }) {
  return (
    <div className={`flex items-center justify-center w-full h-full bg-gradient-to-br ${gradFor(quizId)} bg-slate-50`}>
      <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
        <Timer className="w-7 h-7 text-indigo-400/80" />
      </div>
    </div>
  )
}

/* ── Skeleton ── */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded-full w-4/5" />
        <div className="h-3 bg-slate-100 rounded-full w-2/5" />
        <div className="flex gap-4 pt-3 border-t border-slate-100">
          <div className="h-3 bg-slate-100 rounded-full w-12" />
          <div className="h-3 bg-slate-100 rounded-full w-12" />
          <div className="h-3 bg-slate-100 rounded-full w-12" />
        </div>
      </div>
    </div>
  )
}

/* ── Three-dot menu ── */
function ThreeDotMenu({ disabled, onDuplicate, quizId, onHistory, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (disabled) return <div className="w-7 h-7" />

  const actions = [
    { icon: Pencil,  label: 'Edit',      onClick: () => navigate(`/quizzes/${quizId}/editor`) },
    { icon: Copy,    label: 'Duplicate', onClick: onDuplicate },
    { icon: History, label: 'History',   onClick: () => onHistory?.() },
    { icon: Share2,  label: 'Share',     onClick: () => navigator.clipboard.writeText(`${window.location.origin}/quiz/${quizId}/take`) },
    { icon: Trash2,  label: 'Delete',    onClick: () => onDelete?.(), danger: true },
  ]

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p) }}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 bg-white border border-slate-200/80 rounded-xl shadow-xl py-1.5 w-44 animate-fade-in">
          {actions.map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              onClick={e => { e.stopPropagation(); setOpen(false); onClick?.() }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                danger
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Card ── */
export default function QuizCard({
  quiz,
  isSelected = false,
  onToggleSelect,
  isDisabled = false,
  isSelectionMode = false,
  onDuplicate,
  isHighlighted = false,
  onHistory,
  onDelete,
}) {
  const navigate = useNavigate()
  const {
    title,
    updated_at,
    thumbnail,
    is_private: isPrivate,
    quiz_stats: stats,
    profiles,
    status = 'published',
  } = quiz
  const instructor = profiles?.name

  const formattedDate = new Date(updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  function handleCardClick() {
    if (isSelectionMode) { onToggleSelect?.(); return }
    navigate(`/quizzes/${quiz.id}/editor`)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`
        bg-white rounded-2xl overflow-hidden group
        transition-all duration-200 cursor-pointer
        ${isHighlighted
          ? 'shadow-lg shadow-indigo-100 ring-2 ring-indigo-400 ring-offset-2'
          : isSelected
            ? 'shadow-md shadow-indigo-100 ring-2 ring-indigo-400'
            : 'shadow-sm hover:shadow-md hover:shadow-slate-200'
        }
        ${isDisabled ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        {thumbnail
          ? <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <CardPlaceholder quizId={quiz.id} />
        }

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isSelected || isSelectionMode
            ? (
              <div
                onClick={e => { e.stopPropagation(); onToggleSelect?.() }}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shadow-sm cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white/90 border-slate-400 hover:border-indigo-500'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            )
            : (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
                {status}
              </span>
            )
          }
        </div>

        {isPrivate && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Hover overlay */}
        {!isSelectionMode && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 gap-2">
            {[
              { icon: Eye,       label: 'Preview', to: `/quiz/${quiz.id}/take`          },
              { icon: Pencil,    label: 'Edit',    to: `/quizzes/${quiz.id}/editor`     },
              { icon: BarChart2, label: 'Reports', to: `/results`                       },
            ].map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                onClick={e => { e.stopPropagation(); navigate(to) }}
                className="flex items-center gap-1.5 bg-white text-slate-800 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-start gap-1.5 mb-1">
          <h3 className="flex-1 font-semibold text-slate-900 text-[14px] leading-snug line-clamp-2 min-w-0">
            {title}
          </h3>
          <ThreeDotMenu
            disabled={isSelectionMode || isDisabled}
            onDuplicate={() => onDuplicate?.(quiz)}
            quizId={quiz.id}
            onHistory={onHistory}
            onDelete={onDelete}
          />
        </div>

        <p className="text-[12px] text-slate-500 font-medium">{instructor}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Updated {formattedDate}</p>

        <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-slate-100">
          {[
            { icon: Eye,       val: stats?.views    ?? 0, label: 'views'    },
            { icon: Play,      val: stats?.previews ?? 0, label: 'plays'    },
            { icon: BarChart2, val: stats?.reports  ?? 0, label: 'reports'  },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className="flex items-center gap-1 text-[11px] text-slate-400">
              <Icon className="w-3 h-3" />
              <span className="font-semibold text-slate-600">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
