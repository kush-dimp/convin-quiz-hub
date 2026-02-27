import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Download } from 'lucide-react'
import { useScoreDistribution, usePerformanceOverTime } from '../hooks/useAnalytics'

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4']

function SectionTitle({ children }) {
  return <h3 className="font-heading text-sm font-bold text-slate-900 mb-3">{children}</h3>
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${className}`}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </div>
  )
}

// Heatmap by weekday × time slot
const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const hours = [9,10,11,12,13,14,15,16,17]
const heatmap = days.map(day => Object.fromEntries([['day', day], ...hours.map(h => [h, Math.max(0, Math.round(Math.random()*20 - (day==='Sat'||day==='Sun'?12:0)))])]))

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

export default function AnalyticsDashboard() {
  const { data: scoreDistribution } = useScoreDistribution()
  const { data: perfData }          = usePerformanceOverTime(30)

  // Subsample perfData to every 3rd point to avoid label crowding (mirrors original behaviour)
  const perfDataSampled = perfData.filter((_, i) => i % 3 === 0)

  // Pass/fail derived from score distribution buckets (scores < 70 → fail, >= 70 → pass)
  const passCount = scoreDistribution
    .filter(b => {
      const lower = parseInt(b.range.split('–')[0], 10)
      return lower >= 70
    })
    .reduce((s, b) => s + b.count, 0)
  const failCount = scoreDistribution
    .filter(b => {
      const lower = parseInt(b.range.split('–')[0], 10)
      return lower < 70
    })
    .reduce((s, b) => s + b.count, 0)
  const total = passCount + failCount

  const passData = [
    { name: 'Passed', value: passCount },
    { name: 'Failed',  value: failCount },
  ]

  const completionFunnel = [
    { label: 'Quiz assigned',  count: 312 },
    { label: 'Quiz started',   count: 277 },
    { label: 'Quiz completed', count: 252 },
    { label: 'Quiz passed',    count: 189 },
  ]

  const dropoff = [
    { q: 'Q1', dropoff: 5 }, { q: 'Q2', dropoff: 8 }, { q: 'Q3', dropoff: 12 },
    { q: 'Q4', dropoff: 9 }, { q: 'Q5', dropoff: 18 }, { q: 'Q6', dropoff: 11 },
  ]

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Analytics & Insights</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Quiz performance overview</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Row 1: Score distribution + performance over time */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card title="Score Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} name="Attempts" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">Most attempts scored between 60–80%</p>
          </Card>
          <Card title="Average Score Over Time (30 days)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={perfDataSampled} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[50, 100]} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2} dot={false} name="Avg Score %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Row 2: Pass/fail + completion funnel */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card title="Pass / Fail Breakdown">
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={passData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {passData.map((_, i) => <Cell key={i} fill={i===0?'#22c55e':'#ef4444'} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {passData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${i===0?'bg-emerald-500':'bg-red-400'}`} />
                    <span className="text-sm text-slate-700">{d.name}</span>
                    <span className="font-bold text-slate-900 ml-auto">{d.value}</span>
                    <span className="text-xs text-slate-400">({total > 0 ? Math.round(d.value / total * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="Completion Funnel">
            <div className="space-y-2 mt-2">
              {completionFunnel.map((s, i) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{s.label}</span><span className="font-semibold">{s.count}</span>
                  </div>
                  <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full flex items-center justify-end pr-2 rounded-lg transition-all duration-700"
                      style={{ width: `${(s.count/completionFunnel[0].count)*100}%`, background: `hsl(${245-i*15},80%,${60+i*5}%)` }}
                    >
                      <span className="text-[11px] font-bold text-white">{Math.round(s.count/completionFunnel[0].count*100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 3: Drop-off + Heatmap */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card title="Drop-off Analysis (where users quit)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dropoff} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="q" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} formatter={v => [`${v} users`, 'Drop-off']} />
                <Bar dataKey="dropoff" fill="#f97316" radius={[4,4,0,0]} name="Users who quit" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-amber-600 mt-2">Q5 has the highest drop-off — consider simplifying or adding a hint.</p>
          </Card>
          <Card title="Peak Attempt Times Heatmap">
            <div className="overflow-x-auto">
              <table className="text-[10px] w-full">
                <thead>
                  <tr>
                    <th className="text-slate-400 font-medium pr-2 pb-1 text-left">Day\Hr</th>
                    {hours.map(h => <th key={h} className="text-slate-400 font-medium pb-1 w-8 text-center">{h}h</th>)}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map(row => (
                    <tr key={row.day}>
                      <td className="text-slate-500 font-medium pr-2 py-0.5">{row.day}</td>
                      {hours.map(h => {
                        const v = row[h] || 0
                        return (
                          <td key={h} className="py-0.5 px-0.5">
                            <div title={`${v} attempts`} className="w-7 h-5 rounded flex items-center justify-center text-[9px] font-medium text-white"
                              style={{ backgroundColor: `rgba(99,102,241,${Math.min(v/20, 1)})`, opacity: v === 0 ? 0.1 : 1 }}>
                              {v > 0 ? v : ''}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-2">Peak hours: Tuesday–Thursday, 10 AM–3 PM</p>
          </Card>
        </div>

        {/* Insights */}
        <Card title="AI Insights & Recommendations">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '📈', text: 'Scores have improved by 8% over the last 2 weeks — the recent content updates are working.' },
              { icon: '⚠️', text: 'Q9 has a 17% correct rate — significantly below average. Consider reviewing the question or adding remedial content.' },
              { icon: '🕐', text: 'Most users complete the quiz in under 30 minutes despite a 45-minute limit. Consider adding more questions.' },
              { icon: '🎯', text: 'Users who score below 60% on their first attempt have an 82% retake rate. Targeted feedback may help.' },
            ].map((ins, i) => (
              <div key={i} className="flex gap-2.5 p-3 bg-slate-50 rounded-xl text-sm text-slate-700">
                <span className="text-base flex-shrink-0">{ins.icon}</span>
                <p>{ins.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
