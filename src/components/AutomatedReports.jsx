import { useState } from 'react'
import { FileText, Plus, Play, Pause, Trash2, Mail, Calendar, Check } from 'lucide-react'
import { useResults } from '../hooks/useResults'
import { useQuizzes } from '../hooks/useQuizzes'

const METRICS = ['Average Score','Pass Rate','Total Attempts','Completion Rate','Top Performers','Low Performers','Question Analysis','Certificate Issued','User Engagement','Time Spent']

const mockScheduled = [
  { id: 1, name: 'Weekly Digest',     frequency: 'Weekly',  nextRun: '2026-03-04', recipients: ['alice@corp.com','bob@corp.com'], format: 'PDF',   metrics: ['Average Score','Pass Rate'], paused: false },
  { id: 2, name: 'Monthly Overview',  frequency: 'Monthly', nextRun: '2026-03-01', recipients: ['alice@corp.com'],               format: 'Excel', metrics: ['Total Attempts','Completion Rate'], paused: false },
  { id: 3, name: 'Daily Safety Check',frequency: 'Daily',   nextRun: '2026-02-26', recipients: ['bob@corp.com','carol@corp.com'],format: 'Email', metrics: ['Average Score'],                 paused: true  },
]

export default function AutomatedReports() {
  const [reports, setReports] = useState(mockScheduled)
  const [showBuilder, setShowBuilder] = useState(false)
  const [builder, setBuilder] = useState({ name: '', frequency: 'Weekly', recipients: '', format: 'PDF', metrics: [], quiz: 'All Quizzes' })
  const [saved, setSaved] = useState(false)

  const { results, loading: resultsLoading } = useResults()
  const { quizzes, loading: quizzesLoading } = useQuizzes()

  // Compute real stats from live data
  const totalAttempts = results.length
  const passRate = totalAttempts > 0
    ? Math.round((results.filter(r => r.passed).length / totalAttempts) * 100)
    : 0
  const avgScore = totalAttempts > 0
    ? Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / totalAttempts)
    : 0

  // Build quiz scope options from real quizzes + "All Quizzes" fallback
  const quizOptions = ['All Quizzes', ...quizzes.map(q => q.title)]

  function togglePause(id) { setReports(p => p.map(r => r.id === id ? { ...r, paused: !r.paused } : r)) }
  function deleteReport(id) { setReports(p => p.filter(r => r.id !== id)) }

  function saveReport() {
    const newR = { id: Date.now(), ...builder, recipients: builder.recipients.split(',').map(s=>s.trim()).filter(Boolean), nextRun: '2026-03-04', paused: false }
    setReports(p => [...p, newR]); setSaved(true); setTimeout(() => { setSaved(false); setShowBuilder(false) }, 1200)
  }

  function toggleMetric(m) {
    setBuilder(p => ({ ...p, metrics: p.metrics.includes(m) ? p.metrics.filter(x=>x!==m) : [...p.metrics, m] }))
  }

  function generateReport() {
    // Scope results to the selected quiz if one is chosen
    let scoped = results
    if (builder.quiz !== 'All Quizzes') {
      scoped = results.filter(r => r.quizTitle === builder.quiz)
    }
    const scopedTotal = scoped.length
    const scopedPassed = scoped.filter(r => r.passed).length
    const scopedPassRate = scopedTotal > 0 ? Math.round((scopedPassed / scopedTotal) * 100) : 0
    const scopedAvgScore = scopedTotal > 0 ? Math.round(scoped.reduce((s, r) => s + (r.score ?? 0), 0) / scopedTotal) : 0

    const rows = [
      ['Report', builder.name || 'Unnamed Report'],
      ['Quiz Scope', builder.quiz],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Attempts', scopedTotal],
      ['Pass Rate', `${scopedPassRate}%`],
      ['Average Score', `${scopedAvgScore}%`],
      [],
      ['Name', 'Email', 'Quiz', 'Score', 'Passed', 'Time', 'Date'],
      ...scoped.map(r => [r.userName, r.email, r.quizTitle, `${r.score}%`, r.passed ? 'Yes' : 'No', r.timeTaken, new Date(r.date).toLocaleString()])
    ]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${(builder.name || 'report').replace(/\s+/g,'-').toLowerCase()}.csv` })
    a.click()
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Automated Reports</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Schedule and automate report delivery</p>
            </div>
          </div>
          <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] transition-all"><Plus className="w-4 h-4" /> New Report</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Live stats preview */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Stats Preview</h2>
          {resultsLoading ? (
            <div className="flex gap-6">
              {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalAttempts}</p>
                <p className="text-[12px] text-slate-500">Total Attempts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{passRate}%</p>
                <p className="text-[12px] text-slate-500">Pass Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#E63E6D]">{avgScore}%</p>
                <p className="text-[12px] text-slate-500">Avg Score</p>
              </div>
            </div>
          )}
        </div>

        {/* Scheduled reports */}
        <div className="space-y-3">
          <h2 className="text-[13px] font-bold text-slate-900">Scheduled Reports ({reports.length})</h2>
          {reports.map(r => (
            <div key={r.id} className={`glass-card rounded-2xl p-4 flex items-start gap-4 transition-opacity ${r.paused ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.paused ? 'bg-slate-100 text-slate-400' : 'bg-[#FFF5F7] text-[#E63E6D]'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[13px] font-bold text-slate-900">{r.name}</h3>
                  {r.paused && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Paused</span>}
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{r.frequency}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{r.format}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {r.metrics.map(m => <span key={m} className="text-[10px] bg-[#FFF5F7] text-[#E63E6D] px-1.5 py-0.5 rounded font-medium">{m}</span>)}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Next: {r.nextRun}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.recipients.join(', ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => togglePause(r.id)} className={`p-1.5 rounded-lg transition-colors ${r.paused ? 'text-[#FF6B9D] hover:bg-[#FFF5F7]' : 'text-amber-500 hover:bg-amber-50'}`} title={r.paused ? 'Resume' : 'Pause'}>
                  {r.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteReport(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No scheduled reports. Create one to get started.</div>}
        </div>
      </main>

      {/* Report Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && setShowBuilder(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <Plus className="w-5 h-5 text-[#E63E6D]" />
              <h2 className="text-[13px] font-bold text-slate-900 flex-1">New Automated Report</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Real stats preview inside builder */}
              {!resultsLoading && (
                <div className="bg-[#FFF5F7] border border-[#FFE5EC] rounded-xl px-4 py-3 flex gap-5 text-xs">
                  <div><span className="font-bold text-[#C41E5C]">{totalAttempts}</span><span className="text-[#FF6B9D] ml-1">attempts</span></div>
                  <div><span className="font-bold text-[#C41E5C]">{passRate}%</span><span className="text-[#FF6B9D] ml-1">pass rate</span></div>
                  <div><span className="font-bold text-[#C41E5C]">{avgScore}%</span><span className="text-[#FF6B9D] ml-1">avg score</span></div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Report Name</label>
                <input value={builder.name} onChange={e => setBuilder(p => ({...p, name: e.target.value}))} placeholder="e.g. Weekly Safety Summary" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Frequency</label>
                  <select value={builder.frequency} onChange={e => setBuilder(p=>({...p,frequency:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                    {['Daily','Weekly','Monthly'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Format</label>
                  <select value={builder.format} onChange={e => setBuilder(p=>({...p,format:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                    {['PDF','Excel','HTML Email'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Quiz Scope</label>
                <select value={builder.quiz} onChange={e => setBuilder(p=>({...p,quiz:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                  {quizzesLoading
                    ? <option>Loading quizzes…</option>
                    : quizOptions.map(q => <option key={q}>{q}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Include Metrics</label>
                <div className="flex flex-wrap gap-2">
                  {METRICS.map(m => (
                    <button key={m} onClick={() => toggleMetric(m)} className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${builder.metrics.includes(m) ? 'border-[#FF6B9D] bg-[#FFF5F7] text-[#C41E5C]' : 'border-slate-200 text-slate-600 hover:border-[#FFB3C6]'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Recipients (comma-separated emails)</label>
                <input value={builder.recipients} onChange={e => setBuilder(p=>({...p,recipients:e.target.value}))} placeholder="alice@corp.com, bob@corp.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5 flex-shrink-0">
              <button onClick={() => setShowBuilder(false)} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors">Cancel</button>
              <button
                onClick={generateReport}
                disabled={resultsLoading || results.length === 0}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-40"
              >
                Generate CSV
              </button>
              <button onClick={saveReport} disabled={!builder.name.trim() || builder.metrics.length === 0} className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] transition-all disabled:opacity-40">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Create Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
