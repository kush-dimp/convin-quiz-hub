import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Play, BarChart2, Lock, MoreVertical,
  Pencil, Copy, Share2, Trash2, Timer, Star, Check, History,
} from 'lucide-react'

/* ── Shared: status badge ──────────────────────────────────── */
export function StatusBadge({ status }) {
  const styles = {
    published: 'bg-green-100 text-green-700',
    draft:     'bg-gray-100  text-gray-600',
    archived:  'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  )
}

/* ── Shared: rating stars ──────────────────────────────────── */
function Rating({ value }) {
  return (
    <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      {value?.toFixed(1) ?? '—'}
    </span>
  )
}

/* ── Shared: stat item ─────────────────────────────────────── */
function Stat({ icon: Icon, value }) {
  const display = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
  return (
    <span className="flex items-center gap-0.5 text-xs text-gray-500">
      <Icon className="w-3 h-3 text-gray-400" />
      {display}
    </span>
  )
}

/* ── Shared: selection checkbox ────────────────────────────── */
function SelectBox({ isSelected, isSelectionMode, onToggle }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle?.() }}
      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
        isSelected
          ? 'bg-[#E63E6D] border-[#E63E6D]'
          : 'bg-white border-gray-300 hover:border-[#FF6B9D]'
      } ${isSelectionMode || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
    >
      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </div>
  )
}

/* ── Shared: three-dot menu ────────────────────────────────── */
function ThreeDotMenu({ disabled, onDuplicate, quizId, onHistory, onDelete }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  if (disabled) return <div className="w-7" />

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
        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40"
        >
          {actions.map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onClick?.() }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

/* ── List view card ────────────────────────────────────────── */
export function QuizListCard({
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
  const { title, instructor, category, status, rating, updatedAt, thumbnail, isPrivate, stats } = quiz

  const date = new Date(updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      onClick={isSelectionMode ? onToggleSelect : undefined}
      className={`
        bg-white border rounded-xl flex items-center gap-3 p-3 group
        hover:shadow-md transition-all duration-150 cursor-pointer
        ${isHighlighted
          ? 'border-[#FF6B9D] ring-4 ring-[#FFB3C6] ring-offset-2'
          : isSelected
            ? 'border-[#FF6B9D] ring-2 ring-inset ring-[#FFB3C6] bg-[#FFF5F7]/30'
            : 'border-gray-200'}
        ${isDisabled ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      {/* Checkbox */}
      <SelectBox isSelected={isSelected} isSelectionMode={isSelectionMode} onToggle={onToggleSelect} />

      {/* Thumbnail */}
      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#FFE5EC] to-[#FFE5EC] flex items-center justify-center">
        {thumbnail
          ? <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          : <Timer className="w-7 h-7 text-[#FFB3C6]" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{title}</h3>
          <StatusBadge status={status} />
          {isPrivate && <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {instructor} · <span className="text-gray-400">{category}</span>
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <Stat icon={Eye}       value={stats.views}    />
          <Stat icon={Play}      value={stats.previews} />
          <Stat icon={BarChart2} value={stats.reports}  />
          <Rating value={rating} />
          <span className="ml-auto text-xs text-gray-400 hidden sm:block whitespace-nowrap">
            Edited {date}
          </span>
        </div>
      </div>

      <ThreeDotMenu disabled={isSelectionMode || isDisabled} onDuplicate={() => onDuplicate?.(quiz)} quizId={quiz.id} onHistory={onHistory} onDelete={onDelete} />
    </div>
  )
}

/* ── Compact view ──────────────────────────────────────────── */
export function QuizCompactView({
  quizzes,
  selectedIds,
  onToggleSelect,
  isDisabled,
  isSelectionMode,
  onDuplicate,
  highlightedId,
  onHistory,
  onDelete,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <div className="w-5 flex-shrink-0" />
        <span className="flex-1">Title</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-32">Instructor</span>
        <span className="w-28 hidden lg:block">Category</span>
        <span className="w-20 text-right">Views</span>
        <span className="w-24 text-right hidden lg:block">Edited</span>
        <span className="w-16 text-right">Rating</span>
        <div className="w-7 flex-shrink-0" />
      </div>

      {/* Rows */}
      {quizzes.map((quiz, i) => (
        <CompactRow
          key={quiz.id}
          quiz={quiz}
          isLast={i === quizzes.length - 1}
          isSelected={selectedIds.has(quiz.id)}
          onToggleSelect={() => onToggleSelect(quiz.id)}
          isDisabled={isDisabled}
          isSelectionMode={isSelectionMode}
          onDuplicate={onDuplicate}
          isHighlighted={quiz.id === highlightedId}
          onHistory={onHistory}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function CompactRow({ quiz, isLast, isSelected, onToggleSelect, isDisabled, isSelectionMode, onDuplicate, isHighlighted, onHistory, onDelete }) {
  const { title, instructor, category, status, rating, updatedAt, isPrivate, stats } = quiz
  const date = new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })

  return (
    <div
      onClick={isSelectionMode ? onToggleSelect : undefined}
      className={`
        flex items-center gap-3 px-4 py-2.5 group cursor-pointer transition-colors
        ${!isLast ? 'border-b border-gray-100' : ''}
        ${isHighlighted ? 'bg-[#FFF5F7] outline outline-2 outline-[#FF6B9D]' : isSelected ? 'bg-[#FFF5F7]/60' : 'hover:bg-gray-50'}
        ${isDisabled ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      <SelectBox isSelected={isSelected} isSelectionMode={isSelectionMode} onToggle={onToggleSelect} />

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 truncate">{title}</span>
        {isPrivate && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
      </div>

      {/* Status */}
      <div className="w-24 flex justify-center flex-shrink-0">
        <StatusBadge status={status} />
      </div>

      {/* Instructor */}
      <span className="w-32 text-xs text-gray-500 truncate hidden md:block flex-shrink-0">
        {instructor}
      </span>

      {/* Category */}
      <span className="w-28 text-xs text-gray-400 truncate hidden lg:block flex-shrink-0">
        {category}
      </span>

      {/* Views */}
      <span className="w-20 text-right text-xs text-gray-600 font-medium flex-shrink-0">
        {stats.views >= 1000 ? `${(stats.views / 1000).toFixed(1)}k` : stats.views}
      </span>

      {/* Date */}
      <span className="w-24 text-right text-xs text-gray-400 hidden lg:block flex-shrink-0">
        {date}
      </span>

      {/* Rating */}
      <div className="w-16 flex justify-end flex-shrink-0">
        <Rating value={rating} />
      </div>

      <ThreeDotMenu disabled={isSelectionMode || isDisabled} onDuplicate={() => onDuplicate?.(quiz)} quizId={quiz.id} onHistory={() => onHistory?.(quiz)} onDelete={() => onDelete?.(quiz)} />
    </div>
  )
}
