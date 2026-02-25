import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart2, Users, Clock, Award, TrendingUp, Download, Trash2,
  Mail, Eye, Search, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { useResults, useResultStats } from '../hooks/useResults'
import { supabase } from '../lib/supabase'

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-[13px] text-slate-500 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const SortBtn = ({ field, active, dir, onClick }) => (
  <button onClick={onClick} className="inline-flex items-center gap-0.5 hover:text-slate-900 transition-colors">
    {field}
    {active
      ? (dir === 'asc'
          ? <ChevronUp   className="w-3 h-3 text-indigo-500" />
          : <ChevronDown className="w-3 h-3 text-indigo-500" />)
      : <ChevronDown className="w-3 h-3 opacity-25" />
    }
  </button>
)

export default function ResultsDashboard() {
  const navigate = useNavigate()
  const [search,     setSearch]     = useState('')
  const [filterPass, setFilterPass] = useState('all')
  const [sortField,  setSortField]  = useState('date')
  const [sortDir,    setSortDir]    = useState('desc')
  const [perPage,    setPerPage]    = useState(25)
  const [page,       setPage]       = useState(1)
  const [selected,   setSelected]   = useState(new Set())

  const { results, loading: resultsLoading, refetch } = useResults()
  const { stats } = useResultStats(null)

  async function deleteAttempt(id) {
    await supabase.from('quiz_attempts').delete().eq('id', id)
    refetch()
  }

  async function deleteSelected() {
    if (!selected.size) return
    await supabase.from('quiz_attempts').delete().in('id', [...selected])
    setSelected(new Set())
    refetch()
  }

  const avgScore = stats?.avgScore ?? 0
  const passRate = stats?.passRate ?? 0
  const avgTime  = stats?.avgTime  ?? 0
  const totalPassed = stats?.passed ?? 0

  const filtered = results
    .filter(r => filterPass === 'all' ? true : filterPass === 'pass' ? r.passed : !r.passed)
    .filter(r => {
      const q = search.toLowerCase()
      return !q || r.userName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'date')  return dir * (new Date(b.date) - new Date(a.date))
      if (sortField === 'score') return dir * (b.score - a.score)
      if (sortField === 'name')  return dir * a.userName.localeCompare(b.userName)
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }
  function toggleSelect(id) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function exportCSV() {
    const rows = [['Name','Email','Score','Passed','Time','Date']]
    filtered.forEach(r => rows.push([r.userName, r.email, r.score+'%', r.passed ? 'Yes' : 'No', r.timeTaken, new Date(r.date).toLocaleString()]))
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'results.csv' })
    a.click()
  }

  const scoreBarColor = score => score >= 70 ? 'bg-emerald-400' : 'bg-red-400'
  const scoreTextColor = score => score >= 70 ? 'text-emerald-600' : 'text-red-500'

  if (resultsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 leading-none">Results</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">{results.length} total attempts</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}      label="Total Attempts" value={results.length}    sub="All time"               iconBg="bg-violet-50"  iconColor="text-violet-600" />
          <StatCard icon={TrendingUp} label="Average Score"  value={`${avgScore}%`}    sub="+2.1% from last month"  iconBg="bg-blue-50"    iconColor="text-blue-600"   />
          <StatCard icon={Award}      label="Pass Rate"      value={`${passRate}%`}    sub={`${totalPassed} passed`} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard icon={Clock}      label="Avg Time"       value={`${avgTime}m`}     sub="Per attempt"            iconBg="bg-amber-50"   iconColor="text-amber-600"  />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
          </div>
          <select value={filterPass} onChange={e => setFilterPass(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <option value="all">All Results</option>
            <option value="pass">Passed Only</option>
            <option value="fail">Failed Only</option>
          </select>
          <select value={perPage} onChange={e => setPerPage(+e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-white text-slate-600 focus:outline-none">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[12px] text-slate-500 font-medium">{selected.size} selected</span>
              <button
                onClick={() => {
                  const emails = results.filter(r => selected.has(r.id)).map(r => r.email).join(',')
                  window.open(`mailto:${emails}`)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-10 px-4 py-3.5">
                    <input type="checkbox" className="rounded accent-indigo-600"
                      onChange={e => setSelected(e.target.checked ? new Set(paged.map(r => r.id)) : new Set())} />
                  </th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <SortBtn field="name" active={sortField==='name'} dir={sortDir} onClick={() => toggleSort('name')} />
                  </th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <SortBtn field="score" active={sortField==='score'} dir={sortDir} onClick={() => toggleSort('score')} />
                  </th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <SortBtn field="date" active={sortField==='date'} dir={sortDir} onClick={() => toggleSort('date')} />
                  </th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Att.</th>
                  <th className="w-28 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${selected.has(r.id) ? 'bg-indigo-50/40' : ''}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded accent-indigo-600" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                          {r.userName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {r.flagged && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            <p className="text-[13px] font-semibold text-slate-800">{r.userName}</p>
                          </div>
                          <p className="text-[11px] text-slate-400">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full rounded-full ${scoreBarColor(r.score)}`} style={{ width: `${r.score}%` }} />
                        </div>
                        <span className={`text-[13px] font-bold ${scoreTextColor(r.score)}`}>{r.score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-slate-500">{r.timeTaken}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {r.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-400">
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-slate-400 font-medium">#{r.attempt}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/results/${r.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => window.open(`mailto:${r.email}`)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteAttempt(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <span className="text-[12px] text-slate-400">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                ‹ Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                    page === p ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
