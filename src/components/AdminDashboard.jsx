import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, TrendingUp, Award,
  Activity, Database, HardDrive, Zap, AlertTriangle,
  ArrowUpRight, ArrowDownRight, RefreshCw, Settings,
  CheckCircle, Clock, BarChart2, Plus,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useAdminStats,
  useScoreDistribution,
  usePerformanceOverTime,
  useSignupOverTime,
  usePopularQuizzes,
} from '../hooks/useAnalytics'
import { useAuditLogs } from '../hooks/useAuditLogs'

const SYSTEM = [
  { label: 'Database',     value: '2.4 GB',  pct: 48, status: 'ok',   icon: Database     },
  { label: 'Storage',      value: '18.7 GB', pct: 73, status: 'warn', icon: HardDrive    },
  { label: 'API Response', value: '124 ms',  pct: 25, status: 'ok',   icon: Zap          },
  { label: 'Error Rate',   value: '0.08%',   pct: 8,  status: 'ok',   icon: AlertTriangle},
]

const QUICK = [
  { label: 'Create Quiz',       icon: BookOpen,      color: 'text-[#E63E6D] bg-[#FFF5F7] hover:bg-[#FFE5EC]', to: '/'                },
  { label: 'Invite Users',      icon: Users,         color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',       to: '/users'           },
  { label: 'Export Analytics',  icon: BarChart2,     color: 'text-teal-600 bg-teal-50 hover:bg-teal-100',       to: '/analytics'       },
  { label: 'Review Flags',      icon: AlertTriangle, color: 'text-red-600 bg-red-50 hover:bg-red-100',          to: '/cheat-detection' },
  { label: 'Generate Report',   icon: Activity,      color: 'text-violet-600 bg-violet-50 hover:bg-violet-100', to: '/reports'         },
]

const DEFAULT_WIDGETS = [
  { id: 'stats',    label: 'Key Metrics',    visible: true },
  { id: 'signups',  label: 'User Signups',   visible: true },
  { id: 'quizzes',  label: 'Popular Quizzes',visible: true },
  { id: 'health',   label: 'System Health',  visible: true },
  { id: 'activity', label: 'Recent Activity',visible: true },
  { id: 'quick',    label: 'Quick Actions',  visible: true },
]

function Chip({ delta, positive }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
      positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
    }`}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(delta)}%
    </span>
  )
}

function StatCard({ label, value, sub, delta, positive, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>
        {delta !== undefined && <Chip delta={delta} positive={positive} />}
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-[13px] text-slate-500 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.value}</p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS)
  const [showCustomize, setShowCustomize] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { stats, loading: statsLoading } = useAdminStats()
  const { data: signupData }             = useSignupOverTime()
  const { data: popularQuizzes }         = usePopularQuizzes(5)
  const { logs: auditLogs }              = useAuditLogs({ live: false })

  const show = Object.fromEntries(widgets.map(w => [w.id, w.visible]))
  const activity = (auditLogs ?? []).slice(0, 8)

  const SEV_DOT = {
    critical: 'bg-red-600', error: 'bg-red-400',
    warning: 'bg-amber-400', info: 'bg-emerald-400',
  }

  // Placeholder shown while stats are loading or null
  const dash = '—'
  const totalUsers    = statsLoading || !stats ? dash : stats.totalUsers
  const activeQuizzes = statsLoading || !stats ? dash : stats.activeQuizzes
  const quizzesToday  = statsLoading || !stats ? dash : stats.quizzesToday
  const avgScore      = statsLoading || !stats ? dash : `${stats.avgScore}%`

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 leading-none">Admin Dashboard</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Platform overview &amp; health</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1100) }}
              className={`p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCustomize(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border rounded-xl transition-colors ${
                showCustomize ? 'border-[#FFB3C6] bg-[#FFF5F7] text-[#C41E5C]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <Settings className="w-3.5 h-3.5" /> Widgets
            </button>
          </div>
        </div>
      </header>

      {/* Widget toggle bar */}
      {showCustomize && (
        <div className="bg-[#FFF5F7]/60 border-b border-[#FFE5EC] px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#FF6B9D] uppercase tracking-wider mr-1">Toggle</span>
            {widgets.map(w => (
              <button key={w.id} onClick={() => setWidgets(p => p.map(x => x.id === w.id ? { ...x, visible: !x.visible } : x))}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-semibold border transition-colors ${
                  w.visible ? 'border-[#FF6B9D] bg-[#E63E6D] text-white' : 'border-slate-200 text-slate-400 bg-white'
                }`}>
                {w.visible ? <CheckCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stat cards */}
        {show.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Users"     value={totalUsers}    sub="All time"            delta={12} positive icon={Users}      iconBg="bg-violet-50"  iconColor="text-violet-600" />
            <StatCard label="Active Quizzes"  value={activeQuizzes} sub="Published & live"    delta={5}  positive icon={BookOpen}   iconBg="bg-blue-50"    iconColor="text-blue-600"   />
            <StatCard label="Today's Attempts"value={quizzesToday}  sub="vs yesterday"        delta={3}  positive={false} icon={Activity} iconBg="bg-[#FFF5F7]" iconColor="text-[#E63E6D]" />
            <StatCard label="Avg Score"       value={avgScore}      sub="Platform-wide"       delta={2}  positive icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <StatCard label="Certificates"    value={dash}          sub="Issued all time"     delta={8}  positive icon={Award}      iconBg="bg-amber-50"   iconColor="text-amber-600"  />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: charts */}
          <div className="lg:col-span-2 space-y-5">

            {show.signups && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">User Signups</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Last 12 months</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">+12% avg</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={signupData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="signupGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="signups" stroke="url(#signupGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {show.quizzes && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">Popular Quizzes</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">By total attempts</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={popularQuizzes} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="attempts" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {show.health && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">System Health</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">All systems operational</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="space-y-4">
                  {SYSTEM.map(m => {
                    const Icon = m.icon
                    const barColor = m.status === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'
                    return (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-[12px] mb-1.5">
                          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Icon className="w-3.5 h-3.5 text-slate-400" /> {m.label}
                          </span>
                          <span className="font-bold text-slate-700">{m.value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" /> Uptime</span>
                  <span className="font-bold text-emerald-600">99.97%</span>
                </div>
              </div>
            )}

            {show.quick && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-[14px] font-bold text-slate-900 mb-3.5">Quick Actions</h3>
                <div className="space-y-2">
                  {QUICK.map(a => {
                    const Icon = a.icon
                    return (
                      <button key={a.label} onClick={() => navigate(a.to)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${a.color}`}>
                        <Icon className="w-4 h-4" />
                        {a.label}
                        <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        {show.activity && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Recent Activity</h3>
              <span className="text-[11px] text-slate-400">{activity.length} events</span>
            </div>
            <div className="divide-y divide-slate-50">
              {activity.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEV_DOT[log.severity] || 'bg-slate-300'}`} />
                  <span className="text-[12px] font-semibold text-slate-700 w-28 flex-shrink-0 truncate">{log.user_name}</span>
                  <span className="text-[12px] text-[#E63E6D] font-medium w-36 flex-shrink-0 truncate">{log.action}</span>
                  <span className="text-[12px] text-slate-400 flex-1 truncate hidden md:block">{log.resource}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
