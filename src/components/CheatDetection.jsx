import { useState, useMemo } from 'react'
import { Shield, AlertTriangle, Eye, Flag, Check, X, Filter } from 'lucide-react'
import { useResults } from '../hooks/useResults'

const sevColor = { high: 'text-red-600 bg-red-50', medium: 'text-amber-700 bg-amber-50', low: 'text-blue-600 bg-blue-50' }

function RiskBadge({ score }) {
  const color = score >= 60 ? 'bg-red-50 text-red-600' : score >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}% risk</span>
}

/** Derive suspicion patterns + riskScore from a normalised result record */
function buildSuspicion(r) {
  const patterns = []
  if (r.timeMins < 5 && r.score > 85)
    patterns.push({ type: 'speed',   label: 'Fast + High Score',        severity: 'high'   })
  if ((r.tabSwitches ?? 0) > 3)
    patterns.push({ type: 'tab',     label: `Tab Switching (${r.tabSwitches}x)`, severity: 'medium' })
  if (r.flagged && patterns.length === 0)
    patterns.push({ type: 'flagged', label: 'Flagged by system',         severity: 'medium' })

  const riskScore = Math.min(100, patterns.reduce((s, p) => s + (p.severity === 'high' ? 35 : p.severity === 'medium' ? 20 : 10), 0))
  return { ...r, patterns, riskScore }
}

export default function CheatDetection() {
  const { results: flaggedResults, loading: flaggedLoading } = useResults({ flagged: true })
  const { results: allResults } = useResults()

  const [filter, setFilter] = useState('all')
  const [reviewed, setReviewed] = useState(new Set())
  const [dismissed, setDismissed] = useState(new Set())
  const [toast, setToast] = useState(null)

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  async function clearAttempt(id) {
    try {
      const res = await fetch(`/api/results/attempts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: false }),
      })
      if (!res.ok) throw new Error('Failed to clear')
      setDismissed(p => { const n = new Set(p); n.add(id); return n })
      showToast('Attempt cleared successfully')
    } catch {
      showToast('Failed to clear attempt', false)
    }
  }

  // Build suspicious attempts: flagged results + high tab-switchers from all results
  const suspiciousAttempts = useMemo(() => {
    // Combine flagged results with any non-flagged high tab-switchers
    const seen = new Set()
    const combined = []
    for (const r of flaggedResults) {
      if (!seen.has(r.id)) { seen.add(r.id); combined.push(r) }
    }
    for (const r of allResults) {
      if (!seen.has(r.id) && (r.tabSwitches ?? 0) > 3) {
        seen.add(r.id); combined.push(r)
      }
    }
    return combined.map(buildSuspicion).filter(r => r.patterns.length > 0)
  }, [flaggedResults, allResults])

  const displayed = suspiciousAttempts.filter(a => {
    if (dismissed.has(a.id)) return filter === 'cleared'
    if (filter === 'pending')  return !reviewed.has(a.id)
    if (filter === 'reviewed') return reviewed.has(a.id)
    if (filter === 'cleared')  return false
    return true
  })

  const highRisk = suspiciousAttempts.filter(a => a.riskScore >= 60 && !dismissed.has(a.id)).length
  const pending  = suspiciousAttempts.filter(a => !reviewed.has(a.id) && !dismissed.has(a.id)).length

  // Stats derived from all results
  const tabSwitcherCount = allResults.filter(r => (r.tabSwitches ?? 0) > 3).length

  const loading = flaggedLoading

  return (
    <div className="min-h-screen">
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-6 h-[56px] flex items-center gap-3">
          <Shield className="w-4 h-4 text-[#E63E6D]" />
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 leading-none">Cheat Detection</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Flag and review suspicious attempts</p>
          </div>
          {highRisk > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">{highRisk} high risk</span>}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Flagged Attempts', value: loading ? '…' : suspiciousAttempts.length, color: 'text-red-600'    },
            { label: 'High Risk',        value: loading ? '…' : highRisk,                  color: 'text-red-600'    },
            { label: 'Pending Review',   value: loading ? '…' : pending,                   color: 'text-amber-600'  },
            { label: 'Cleared',          value: dismissed.size,                             color: 'text-emerald-600'},
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Detection types info */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Detection Patterns</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Speed + Score', desc: 'Completed very fast with high score', icon: '⚡' },
              { label: 'Tab Switching',  desc: `Switched browser tabs during quiz (${tabSwitcherCount} users)`,   icon: '🔀' },
              { label: 'Answer Pattern', desc: 'Systematic A,B,C,D pattern detected', icon: '🔄' },
              { label: 'Shared IP',      desc: 'Multiple users from same IP address', icon: '🌐' },
              { label: 'Paste Detected', desc: 'Text paste events during quiz',        icon: '📋' },
            ].map(d => (
              <div key={d.label} className="text-center p-2.5 bg-slate-50 rounded-xl">
                <span className="text-xl">{d.icon}</span>
                <p className="text-[11px] font-semibold text-slate-700 mt-1">{d.label}</p>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {['all','pending','reviewed','cleared'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-[#E63E6D] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#FFB3C6]'}`}>{f}</button>
          ))}
        </div>

        {/* Flagged list */}
        <div className="space-y-3">
          {loading && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border-l-4 border-l-slate-200 p-4 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded animate-pulse w-1/3" />
                <div className="h-2.5 bg-slate-100 rounded animate-pulse w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          )}
          {!loading && displayed.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <Shield className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No attempts in this category</p>
            </div>
          )}
          {!loading && displayed.map(attempt => (
            <div key={attempt.id} className={`bg-white rounded-2xl shadow-sm border-l-4 p-4 transition-opacity ${reviewed.has(attempt.id) ? 'opacity-70' : ''} ${attempt.riskScore >= 60 ? 'border-l-red-400' : attempt.riskScore >= 30 ? 'border-l-amber-400' : 'border-l-slate-200'}`}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-slate-800">{attempt.userName}</span>
                    <span className="text-[12px] text-slate-400">{attempt.email}</span>
                    <RiskBadge score={attempt.riskScore} />
                    {reviewed.has(attempt.id) && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Reviewed</span>}
                  </div>
                  <div className="text-[12px] text-slate-400 mt-1">
                    Score: <strong className="text-slate-600">{attempt.score}%</strong> · Time: <strong className="text-slate-600">{attempt.timeMins}m</strong> · Date: {new Date(attempt.date).toLocaleDateString()} · Attempt #{attempt.attempt}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {attempt.patterns.map((p, i) => (
                      <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sevColor[p.severity]}`}>
                        {p.severity === 'high' ? '🔴' : p.severity === 'medium' ? '🟡' : '🔵'} {p.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setReviewed(p => { const n = new Set(p); n.has(attempt.id) ? n.delete(attempt.id) : n.add(attempt.id); return n })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${reviewed.has(attempt.id) ? 'text-slate-500 border-slate-200 hover:bg-slate-50' : 'text-[#E63E6D] border-[#FFB3C6] bg-[#FFF5F7] hover:bg-[#FFE5EC]'}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {reviewed.has(attempt.id) ? 'Unmark' : 'Mark Reviewed'}
                  </button>
                  <button
                    onClick={() => clearAttempt(attempt.id)}
                    className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Clear (False +)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
