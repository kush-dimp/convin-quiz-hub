import { useState } from 'react'
import { FileText, AlertTriangle, TrendingDown, TrendingUp, Clock, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useQuestionPerformance } from '../hooks/useAnalytics'

const diffColor = { Easy: 'text-emerald-700 bg-emerald-50', Medium: 'text-amber-700 bg-amber-50', Hard: 'text-red-600 bg-red-50', Expert: 'text-violet-700 bg-violet-50' }

function Flag({ type, children }) {
  const styles = {
    easy:    'bg-blue-50 border-blue-200 text-blue-700',
    hard:    'bg-red-50 border-red-200 text-red-600',
    time:    'bg-amber-50 border-amber-200 text-amber-700',
    ok:      'bg-emerald-50 border-emerald-200 text-emerald-700',
  }
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[type] || styles.ok}`}>{children}</span>
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function QuestionAnalysis() {
  const [sortField, setSortField] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  const [filter, setFilter] = useState('all')

  const { data: questionData, loading } = useQuestionPerformance(null)

  function getFlag(q) {
    const pct = Math.round(q.correct / q.total * 100)
    if (pct > 95) return { type: 'easy', label: 'Too Easy (>95%)' }
    if (pct < 20) return { type: 'hard', label: 'Too Hard (<20%)' }
    if (q.avgTime > 80) return { type: 'time', label: 'Time Outlier' }
    return null
  }

  const sorted = [...questionData].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortField === 'id') return dir * (a.id - b.id)
    if (sortField === 'pct') return dir * ((b.correct/b.total) - (a.correct/a.total))
    if (sortField === 'time') return dir * (b.avgTime - a.avgTime)
    if (sortField === 'disc') return dir * (b.discriminationIndex - a.discriminationIndex)
    return 0
  })

  const displayed = sorted.filter(q => {
    if (filter === 'all') return true
    const pct = q.correct/q.total*100
    if (filter === 'easy') return pct > 95
    if (filter === 'hard') return pct < 20
    if (filter === 'review') return getFlag(q) !== null
    return true
  })

  function toggleSort(f) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  function exportCSV() {
    const rows = [['Question', 'Correct %', 'Total', 'Avg Time (s)', 'Discrimination Index', 'Difficulty', 'Flag']]
    displayed.forEach(q => {
      const pct = Math.round(q.correct / q.total * 100)
      const flag = getFlag(q)
      rows.push([`"${q.text.replace(/"/g, '""')}"`, pct + '%', q.total, q.avgTime, q.discriminationIndex, q.difficulty, flag ? flag.label : 'OK'])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'question-analysis.csv' })
    a.click()
  }

  const optionDist = [
    { name: 'Option A', value: 45, correct: false },
    { name: 'Option B', value: 201, correct: true  },
    { name: 'Option C', value: 22, correct: false  },
    { name: 'Option D', value: 9,  correct: false  },
  ]

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Question Performance Analysis</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Per-question metrics and flags</p>
            </div>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#E63E6D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading question data…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Too Easy (>95%)', count: questionData.filter(q=>q.correct/q.total>0.95).length, icon: TrendingUp,   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600'   },
                { label: 'Too Hard (<20%)',  count: questionData.filter(q=>q.correct/q.total<0.2).length,  icon: TrendingDown, iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
                { label: 'Time Outliers',    count: questionData.filter(q=>q.avgTime>80).length,            icon: Clock,        iconBg: 'bg-amber-50',  iconColor: 'text-amber-600'  },
                { label: 'Needs Review',     count: questionData.filter(q=>getFlag(q)!==null).length,       icon: AlertTriangle, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
              ].map(({ label, count, icon: Icon, iconBg, iconColor }) => (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                    <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{count}</p>
                  <p className="text-[13px] text-slate-500 mt-1.5 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {['all','easy','hard','review'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors capitalize ${
                    filter === f
                      ? 'bg-[#E63E6D] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-[#FFB3C6]'
                  }`}
                >
                  {f === 'review' ? 'Needs Review' : f === 'all' ? 'All Questions' : f === 'easy' ? 'Too Easy' : 'Too Hard'}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {displayed.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No questions found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Question</th>
                      <th className="text-center px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 cursor-pointer hover:text-slate-600" onClick={() => toggleSort('pct')}>Correct %</th>
                      <th className="text-center px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Total</th>
                      <th className="text-center px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 cursor-pointer hover:text-slate-600" onClick={() => toggleSort('time')}>Avg Time</th>
                      <th className="text-center px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 cursor-pointer hover:text-slate-600" onClick={() => toggleSort('disc')}>Discrimination</th>
                      <th className="text-center px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Difficulty</th>
                      <th className="text-center px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((q, idx) => {
                      const pct = Math.round(q.correct / q.total * 100)
                      const flag = getFlag(q)
                      return (
                        <tr key={q.id ?? idx} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${flag ? 'bg-amber-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-semibold text-slate-800 max-w-xs truncate">Q{idx+1}: {q.text}</p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[12px] font-semibold text-slate-700 w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-[12px] text-slate-400">{q.total}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-[12px] font-medium ${q.avgTime > 80 ? 'text-amber-600' : 'text-slate-600'}`}>{q.avgTime}s</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#FF6B9D] rounded-full" style={{ width: `${q.discriminationIndex * 100}%` }} />
                              </div>
                              <span className="text-[12px] text-slate-400">{q.discriminationIndex.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${diffColor[q.difficulty] ?? 'text-slate-600 bg-slate-50'}`}>{q.difficulty}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {flag ? <Flag type={flag.type}>{flag.label}</Flag> : <Flag type="ok">OK</Flag>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Option distribution for a sample question */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold text-slate-900 mb-1">Option Distribution — Q2: Explain TCP vs UDP</h3>
              <p className="text-[12px] text-slate-400 mb-4">How users distributed across answer choices (277 attempts)</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={optionDist} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {optionDist.map((e,i) => <Cell key={i} fill={e.correct ? '#22c55e' : '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[12px] text-slate-400 mt-2">Option B (correct) selected by 73% of users. Options A and C need reviewing as distractors.</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
