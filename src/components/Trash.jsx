import { useState, useEffect } from 'react'
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react'
import { useQuizzes } from '../hooks/useQuizzes'
import { ToastContainer } from './Toast'

let toastCounter = 0

export default function Trash() {
  const [trashedQuizzes, setTrashedQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [toasts, setToasts] = useState([])
  const { restoreFromTrash } = useQuizzes()

  useEffect(() => {
    async function loadTrash() {
      try {
        const res = await fetch('/api/quizzes?trash=true')
        const data = await res.json()
        setTrashedQuizzes(Array.isArray(data) ? data : [])
      } catch (err) {
        addToast('error', 'Failed to load trash')
      } finally {
        setLoading(false)
      }
    }
    loadTrash()
  }, [])

  function addToast(type, message) {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, type, message, duration: 4000 }])
  }
  function removeToast(id) { setToasts((prev) => prev.filter((t) => t.id !== id)) }

  function toggleSelect(id) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const selectAll = () => setSelectedIds(new Set(trashedQuizzes.map(q => q.id)))
  const deselectAll = () => setSelectedIds(new Set())

  async function handleRestore() {
    if (selectedIds.size === 0) return
    try {
      await restoreFromTrash(Array.from(selectedIds))
      setTrashedQuizzes(prev => prev.filter(q => !selectedIds.has(q.id)))
      setSelectedIds(new Set())
      addToast('success', `${selectedIds.size} quiz${selectedIds.size > 1 ? 'zes' : ''} restored`)
    } catch (err) {
      addToast('error', 'Failed to restore')
    }
  }

  async function handlePermanentDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Permanently delete ${selectedIds.size} quiz${selectedIds.size > 1 ? 'zes' : ''}? This cannot be undone.`)) return
    try {
      for (const id of selectedIds) {
        await fetch(`/api/quizzes/${id}`, { method: 'DELETE' })
      }
      setTrashedQuizzes(prev => prev.filter(q => !selectedIds.has(q.id)))
      setSelectedIds(new Set())
      addToast('success', `${selectedIds.size} quiz${selectedIds.size > 1 ? 'zes' : ''} permanently deleted`)
    } catch (err) {
      addToast('error', 'Failed to delete')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Trash</h1>
            <p className="font-body text-[11px] text-slate-400 mt-0.5">{trashedQuizzes.length} quizzes in trash</p>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Restore ({selectedIds.size})
              </button>
              <button
                onClick={handlePermanentDelete}
                className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-500">Loading...</div>
          </div>
        ) : trashedQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trash2 className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500 text-sm">Your trash is empty</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === trashedQuizzes.length && trashedQuizzes.length > 0}
                        onChange={() => selectedIds.size === trashedQuizzes.length ? deselectAll() : selectAll()}
                        className="rounded accent-[#E63E6D]"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Deleted</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trashedQuizzes.map(q => {
                    const deletedAt = q.deleted_at ? new Date(q.deleted_at) : null
                    const daysLeft = deletedAt ? Math.max(0, 7 - Math.floor((Date.now() - deletedAt.getTime()) / (24 * 60 * 60 * 1000))) : 7
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(q.id)}
                            onChange={() => toggleSelect(q.id)}
                            className="rounded accent-[#E63E6D]"
                          />
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">{q.title}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-600">
                          {deletedAt ? deletedAt.toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {daysLeft === 0 ? (
                            <span className="text-red-600 font-semibold">Today</span>
                          ) : (
                            <span className={daysLeft <= 2 ? 'text-orange-600' : 'text-slate-600'}>{daysLeft} days</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} onUndo={() => {}} />
    </div>
  )
}
