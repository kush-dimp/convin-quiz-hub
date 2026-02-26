import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X, RotateCcw } from 'lucide-react'

const ICONS = {
  success: { Icon: CheckCircle, color: 'text-green-400' },
  error:   { Icon: XCircle,     color: 'text-red-400'   },
  warning: { Icon: AlertCircle, color: 'text-yellow-400' },
  undo:    { Icon: RotateCcw,   color: 'text-[#FF6B9D]' },
}

/* ── Single toast ──────────────────────────────────────────── */
function Toast({ id, type, message, undoData, duration = 4000, onRemove, onUndo }) {
  const [visible, setVisible] = useState(false)
  const [barWidth, setBarWidth] = useState(100)
  const { Icon, color } = ICONS[type] || ICONS.success

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Progress bar
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(0), 50)
    return () => clearTimeout(t)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), duration + 100)
    return () => clearTimeout(t)
  }, [])

  function handleUndo() {
    onUndo(undoData)
    onRemove(id)
  }

  return (
    <div
      className={`relative bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden min-w-72 max-w-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
        <span className="text-sm flex-1">{message}</span>

        {type === 'undo' && (
          <button
            onClick={handleUndo}
            className="text-xs font-semibold text-[#FFB3C6] hover:text-white transition-colors whitespace-nowrap border border-[#FF6B9D]/40 px-2 py-0.5 rounded-md hover:border-[#FF6B9D]"
          >
            Undo
          </button>
        )}

        <button
          onClick={() => onRemove(id)}
          className="text-gray-500 hover:text-gray-200 transition-colors ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Countdown bar */}
      <div className="h-0.5 bg-gray-800">
        <div
          className="h-full bg-[#FF6B9D] rounded-full"
          style={{
            width: `${barWidth}%`,
            transition: `width ${duration}ms linear`,
          }}
        />
      </div>
    </div>
  )
}

/* ── Toast container (portal-style fixed position) ─────────── */
export function ToastContainer({ toasts, onRemove, onUndo }) {
  return (
    <div className="fixed bottom-24 right-5 z-[100] flex flex-col gap-2.5 items-end">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          {...t}
          onRemove={onRemove}
          onUndo={onUndo}
        />
      ))}
    </div>
  )
}
