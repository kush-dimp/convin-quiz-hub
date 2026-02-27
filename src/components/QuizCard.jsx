import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Play, BarChart2, Lock, MoreVertical,
  Pencil, Copy, Share2, Trash2, Check, History,
} from 'lucide-react'

const STATUS_STYLES = {
  published: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  draft:     'bg-slate-500/20    text-slate-300   border-slate-500/20',
  archived:  'bg-amber-500/20    text-amber-300   border-amber-500/30',
}

/* Per-card color palette — vibrant gradient thumbnail + matching tinted body */
const PALETTE = [
  { grad: 'from-[#FF6B9D] to-[#C41E5C]', bg: 'bg-pink-50',   border: 'border-pink-200',   statBorder: 'border-pink-100',   icon: 'text-[#E63E6D]',  hover: 'hover:bg-pink-100'   },
  { grad: 'from-blue-500 to-cyan-600',    bg: 'bg-blue-50',   border: 'border-blue-200',   statBorder: 'border-blue-100',   icon: 'text-blue-500',   hover: 'hover:bg-blue-100'   },
  { grad: 'from-violet-500 to-purple-600',bg: 'bg-violet-50', border: 'border-violet-200', statBorder: 'border-violet-100', icon: 'text-violet-500', hover: 'hover:bg-violet-100' },
  { grad: 'from-rose-500 to-orange-500',  bg: 'bg-rose-50',   border: 'border-rose-200',   statBorder: 'border-rose-100',   icon: 'text-rose-500',   hover: 'hover:bg-rose-100'   },
  { grad: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50',   border: 'border-teal-200',   statBorder: 'border-teal-100',   icon: 'text-teal-500',   hover: 'hover:bg-teal-100'   },
  { grad: 'from-amber-500 to-orange-400', bg: 'bg-amber-50',  border: 'border-amber-200',  statBorder: 'border-amber-100',  icon: 'text-amber-500',  hover: 'hover:bg-amber-100'  },
]
function paletteFor(id) { return PALETTE[id % PALETTE.length] }

const CATEGORY_ICON = {
  'General': '📚', 'Technology': '💻', 'Science': '🔬',
  'Math': '📐', 'HR': '👥', 'Safety': '🛡️',
  'Compliance': '✅', 'Certification': '🏆', 'AWS': '☁️',
  'Trivia': '🎯', 'Survey': '📋', 'Cloud': '☁️',
  'Engineering': '⚙️', 'Marketing': '📣', 'Finance': '💰',
}

function CardPlaceholder({ quiz }) {
  const p    = paletteFor(quiz.id)
  const icon = CATEGORY_ICON[quiz.category] || '📝'
  const first = (quiz.title || '?')[0].toUpperCase()
  return (
    <div className={`relative flex items-center justify-center w-full h-full bg-gradient-to-br ${p.grad}`}>
      {/* Giant backdrop letter */}
      <span className="absolute font-heading text-[96px] font-black text-white/[0.12] select-none leading-none pointer-events-none">
        {first}
      </span>
      {/* Category badge */}
      {quiz.category && (
        <span className="absolute bottom-2.5 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-white/90">
          {quiz.category}
        </span>
      )}
      {/* Floating icon */}
      <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float text-2xl">
        {icon}
      </div>
    </div>
  )
}

/* ── Skeleton ── */
export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse shadow-sm">
      <div className="h-44 bg-slate-100" />
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
function ThreeDotMenu({ disabled, onDuplicate, quizId, onHistory, onDelete, hoverClass }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
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

  function handleOpen(e) {
    e.stopPropagation()
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const right = window.innerWidth - rect.right
    if (spaceBelow < 220) {
      setMenuPos({ bottom: window.innerHeight - rect.top + 4, right, top: undefined })
    } else {
      setMenuPos({ top: rect.bottom + 4, right, bottom: undefined })
    }
    setOpen(p => !p)
  }

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`p-1.5 rounded-lg ${hoverClass} text-slate-400 hover:text-slate-600 transition-colors`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, zIndex: 9999 }}
          className="bg-white border border-slate-200/80 rounded-xl shadow-xl py-1.5 w-44"
        >
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
        </div>,
        document.body
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
  const p = paletteFor(quiz.id)

  const formattedDate = new Date(updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  function handleCardClick() {
    if (isSelectionMode) { onToggleSelect?.(); return }
    navigate(`/quizzes/${quiz.id}/editor`)
  }

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'ripple-effect'
    ripple.style.left = `${e.clientX - rect.left - 50}px`
    ripple.style.top  = `${e.clientY - rect.top  - 50}px`
    e.currentTarget.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
    handleCardClick()
  }

  return (
    <div
      onClick={handleClick}
      className={`
        card-accent-bar rounded-2xl overflow-hidden group
        border ${p.border} ${p.bg}
        shadow-md hover:shadow-xl hover:shadow-black/10
        transition-all duration-200 cursor-pointer hover:-translate-y-1
        ${isHighlighted
          ? 'ring-2 ring-[#FF6B9D] ring-offset-2 ring-offset-transparent'
          : isSelected
            ? 'ring-2 ring-[#FF6B9D]'
            : ''
        }
        ${isDisabled ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {thumbnail
          ? <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <CardPlaceholder quiz={quiz} />
        }

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isSelected || isSelectionMode
            ? (
              <div
                onClick={e => { e.stopPropagation(); onToggleSelect?.() }}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shadow-sm cursor-pointer transition-all ${
                  isSelected ? 'bg-[#E63E6D] border-[#E63E6D]' : 'bg-white/90 border-slate-400 hover:border-[#FF6B9D]'
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 gap-2">
            {[
              { icon: Eye,       label: 'Preview', to: `/quiz/${quiz.id}/take`      },
              { icon: Pencil,    label: 'Edit',    to: `/quizzes/${quiz.id}/editor` },
              { icon: BarChart2, label: 'Reports', to: `/results`                   },
            ].map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                onClick={e => { e.stopPropagation(); navigate(to) }}
                className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-slate-800 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg hover:bg-white transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-1">
        <div className="flex items-start gap-1.5 mb-1">
          <h3 className="flex-1 font-heading font-bold text-slate-800 text-[14px] leading-snug line-clamp-2 min-w-0">
            {title}
          </h3>
          <ThreeDotMenu
            disabled={isSelectionMode || isDisabled}
            onDuplicate={() => onDuplicate?.(quiz)}
            quizId={quiz.id}
            onHistory={onHistory}
            onDelete={onDelete}
            hoverClass={p.hover}
          />
        </div>

        <p className="text-[12px] text-slate-500 font-medium">{instructor}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Updated {formattedDate}</p>
      </div>

      {/* Stats band */}
      <div className={`flex items-center gap-4 mx-0 px-4 py-2.5 mt-2 border-t ${p.statBorder}`}>
        {[
          { icon: Eye,       val: stats?.views    ?? 0, label: 'views'   },
          { icon: Play,      val: stats?.previews ?? 0, label: 'plays'   },
          { icon: BarChart2, val: stats?.reports  ?? 0, label: 'reports' },
        ].map(({ icon: Icon, val, label }) => (
          <div key={label} className="flex items-center gap-1 text-[11px]">
            <Icon className={`w-3 h-3 ${p.icon}`} />
            <span className="font-bold text-slate-700">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </span>
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
