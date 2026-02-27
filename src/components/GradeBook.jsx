import { useState, useMemo } from 'react'
import { BookOpen, Download } from 'lucide-react'
import { useResults } from '../hooks/useResults'
import { useUsers } from '../hooks/useUsers'

function cellColor(score) {
  if (score === null) return 'bg-slate-50 text-slate-300'
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 font-semibold'
  if (score >= 70) return 'bg-blue-50 text-blue-700 font-semibold'
  if (score >= 50) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

function letterGrade(score) {
  if (score === null) return '—'
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export default function GradeBook() {
  const [editingCell, setEditingCell] = useState(null)
  const [overrides, setOverrides] = useState({})

  const { results, loading: resultsLoading } = useResults()
  const { users, loading: usersLoading } = useUsers()

  const loading = resultsLoading || usersLoading

  // Build unique quiz columns from results (up to 8)
  const quizCols = useMemo(() => {
    const seen = new Map()
    for (const r of results) {
      if (!seen.has(r.quizId)) {
        seen.set(r.quizId, { id: r.quizId, title: r.quizTitle || r.quizId })
      }
    }
    return Array.from(seen.values()).slice(0, 8)
  }, [results])

  // Build gradebook rows: for each user, get best score per quiz
  const gradebook = useMemo(() => {
    const displayUsers = users.slice(0, 12)
    return displayUsers.map(u => {
      const userResults = results.filter(r => r.userId === u.id)
      const scores = quizCols.map(q => {
        const attempts = userResults.filter(r => r.quizId === q.id)
        if (attempts.length === 0) return null
        return Math.max(...attempts.map(a => a.score))
      })
      return { user: u, scores }
    })
  }, [users, results, quizCols])

  function getScore(userId, quizIndex) {
    const key = `${userId}_${quizIndex}`
    if (overrides[key] !== undefined) return overrides[key]
    const row = gradebook.find(r => r.user.id === userId)
    return row ? row.scores[quizIndex] : null
  }

  function setOverride(userId, quizIndex, val) {
    setOverrides(p => ({ ...p, [`${userId}_${quizIndex}`]: val === '' ? null : +val }))
    setEditingCell(null)
  }

  function avgScore(userId) {
    const scores = quizCols.map((_, i) => getScore(userId, i)).filter(s => s !== null)
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  }

  function exportCSV() {
    const headers = ['User', ...quizCols.map(q => q.title.slice(0, 20)), 'Average', 'Grade']
    const rows = gradebook.map(({ user }) => {
      const scores = quizCols.map((_, i) => getScore(user.id, i) ?? '')
      const avg = avgScore(user.id)
      return [user.name, ...scores, avg ?? '', letterGrade(avg)]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'gradebook.csv' })
    a.click()
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Grade Book</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Student grade overview</p>
            </div>
          </div>
          <button onClick={exportCSV} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium shadow-sm flex items-center gap-1.5"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#E63E6D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading gradebook…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs items-center">
              {[
                ['bg-emerald-100 text-emerald-700', '80–100% (Pass)'],
                ['bg-blue-100 text-blue-700',        '70–79%'],
                ['bg-amber-100 text-amber-700',       '50–69%'],
                ['bg-red-100 text-red-600',           '< 50% (Fail)'],
                ['bg-slate-100 text-slate-400',       'Not attempted'],
              ].map(([cls, label]) => (
                <span key={label} className={`px-2.5 py-1 rounded-full font-medium ${cls}`}>{label}</span>
              ))}
              <span className="text-slate-400 ml-2">Click any cell to override grade</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="sticky left-0 bg-white text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider min-w-36 z-10">Student</th>
                      {quizCols.map(q => (
                        <th key={q.id} className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap max-w-20">
                          <div className="truncate max-w-20" title={q.title}>{q.title.slice(0, 15)}</div>
                        </th>
                      ))}
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg</th>
                      <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gradebook.map(({ user }) => {
                      const avg = avgScore(user.id)
                      return (
                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                          <td className="sticky left-0 bg-white px-4 py-2.5 z-10 border-r border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#FFE5EC] flex items-center justify-center text-[10px] font-bold text-[#E63E6D] flex-shrink-0">{user.name?.[0] ?? '?'}</div>
                              <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">{user.name}</span>
                            </div>
                          </td>
                          {quizCols.map((q, qi) => {
                            const score = getScore(user.id, qi)
                            const key = `${user.id}_${qi}`
                            const isEditing = editingCell === key
                            return (
                              <td key={q.id} className={`px-1 py-1.5 text-center ${cellColor(score)}`}>
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    type="number" min={0} max={100}
                                    defaultValue={score ?? ''}
                                    onBlur={e => setOverride(user.id, qi, e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') setOverride(user.id, qi, e.target.value); if (e.key === 'Escape') setEditingCell(null) }}
                                    className="w-14 text-center bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]/60"
                                  />
                                ) : (
                                  <button onClick={() => setEditingCell(key)} className="w-full text-xs rounded px-2 py-1 hover:ring-2 ring-[#FFB3C6] transition-all" title="Click to edit">
                                    {score !== null ? `${score}%` : '—'}
                                  </button>
                                )}
                              </td>
                            )
                          })}
                          <td className={`px-3 py-2.5 text-center text-xs font-bold ${avg !== null ? avg >= 70 ? 'text-emerald-700' : 'text-red-600' : 'text-slate-400'}`}>
                            {avg !== null ? `${avg}%` : '—'}
                          </td>
                          <td className={`px-3 py-2.5 text-center text-sm font-bold ${avg !== null ? avg >= 70 ? 'text-emerald-700' : 'text-red-600' : 'text-slate-300'}`}>
                            {letterGrade(avg)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-slate-400">Click any score cell to manually override the grade. Press Enter to confirm or Escape to cancel.</p>
          </>
        )}
      </main>
    </div>
  )
}
