import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { X, History, RotateCcw, GitCompare, User, Clock, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Save } from 'lucide-react'

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function DiffView({ version }) {
  const changes = version.changes ?? { added: [], removed: [], modified: [] }
  const added    = Array.isArray(changes.added)    ? changes.added    : []
  const removed  = Array.isArray(changes.removed)  ? changes.removed  : []
  const modified = Array.isArray(changes.modified) ? changes.modified : []
  return (
    <div className="space-y-2 text-xs font-mono">
      {added.map((item, i) => (
        <div key={i} className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <span className="text-emerald-700 font-bold flex-shrink-0">+</span>
          <span className="text-emerald-700">{item}</span>
        </div>
      ))}
      {removed.map((item, i) => (
        <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="text-red-600 font-bold flex-shrink-0">−</span>
          <span className="text-red-600 line-through">{item}</span>
        </div>
      ))}
      {modified.map((item, i) => (
        <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-700 font-bold flex-shrink-0">~</span>
          <span className="text-amber-700">{item}</span>
        </div>
      ))}
      {added.length === 0 && removed.length === 0 && modified.length === 0 && (
        <p className="text-slate-400 text-center py-2">No recorded changes</p>
      )}
    </div>
  )
}

function RestoreModal({ version, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="font-heading text-sm font-bold text-slate-900">Restore Version {version.version_num}?</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-500 leading-relaxed">
            This will overwrite the current version with the state from <strong className="text-slate-700">{new Date(version.created_at).toLocaleString()}</strong>.
            Any unsaved changes will be lost.
          </p>
          <div className="flex gap-3 mt-5">
            <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-xl text-[13px] font-medium transition-colors">Cancel</button>
            <button onClick={onConfirm} className="flex-1 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] transition-all flex items-center justify-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VersionHistory({ quiz, onClose }) {
  const params = useParams()
  const id = params.id ?? quiz?.id

  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [compare, setCompare] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restored, setRestored] = useState(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    async function load() {
      setLoading(true)
      const res  = await fetch(`/api/quiz-versions?quizId=${id}`)
      const data = await res.json()
      setVersions(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [id])

  function handleRestore() {
    setRestored(restoreTarget)
    setRestoreTarget(null)
  }

  // Normalise field names from DB shape to what the UI uses
  function authorName(v) {
    return v.profiles?.name ?? 'Unknown'
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full bg-white shadow-2xl flex flex-col w-full max-w-2xl z-40">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <History className="w-5 h-5 text-[#E63E6D]" />
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-sm font-bold text-slate-900">Version History</h2>
            <p className="text-xs text-slate-500 truncate">"{quiz?.title ?? 'Quiz'}" · {versions.length} versions</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-2.5 py-1.5">
            <Save className="w-3.5 h-3.5" />
            Auto-saved 2m ago
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restored banner */}
        {restored && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-medium text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            Successfully restored to Version {restored.version_num} from {new Date(restored.created_at).toLocaleString()}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Version list */}
          <div className="w-72 flex-shrink-0 border-r border-slate-100 overflow-y-auto bg-slate-50">
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-slate-100 space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-slate-100 rounded animate-pulse w-1/2" />
                </div>
              ))
            )}
            {!loading && versions.map((v, i) => (
              <div key={v.id}>
                {/* Day group label */}
                {(i === 0 || new Date(versions[i-1].created_at).toDateString() !== new Date(v.created_at).toDateString()) && (
                  <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 sticky top-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {new Date(v.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => { setSelected(v); setCompare(null) }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selected?.id === v.id ? 'bg-[#FFF5F7] border-l-2 border-l-[#FF6B9D]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-bold ${i === 0 ? 'text-[#E63E6D]' : 'text-slate-700'}`}>
                      v{v.version_num} {i === 0 && '· Current'}
                    </span>
                    {v.is_auto_save && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-100">Auto</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-snug truncate">{v.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{authorName(v).split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo(v.created_at)}</span>
                  </div>
                </button>
              </div>
            ))}
            {!loading && versions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <History className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No versions found</p>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto bg-white">
            {selected ? (
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-slate-900">Version {selected.version_num}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(selected.created_at).toLocaleString()} by {authorName(selected)}</p>
                    <p className="text-xs text-slate-700 mt-1 font-medium">{selected.summary}</p>
                  </div>
                  {selected.id !== versions[0]?.id && (
                    <button
                      onClick={() => setRestoreTarget(selected)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm shadow-[#FFB3C6] transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5" /> Changes in this version
                  </h4>
                  <DiffView version={selected} />
                </div>

                {/* Compare picker */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Compare with another version</h4>
                  <select
                    value={compare?.id || ''}
                    onChange={e => setCompare(versions.find(v => v.id === e.target.value) || null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
                  >
                    <option value="">Select a version…</option>
                    {versions.filter(v => v.id !== selected.id).map(v => (
                      <option key={v.id} value={v.id}>v{v.version_num} — {v.summary}</option>
                    ))}
                  </select>
                  {compare && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <p className="font-semibold text-slate-700 mb-2">v{compare.version_num}: {compare.summary}</p>
                      <DiffView version={compare} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <History className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400">Select a version</p>
                <p className="text-xs text-slate-300 mt-1">Click any version on the left to view details and changes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {restoreTarget && (
        <RestoreModal version={restoreTarget} onConfirm={handleRestore} onCancel={() => setRestoreTarget(null)} />
      )}
    </>
  )
}
