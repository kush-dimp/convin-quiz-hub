import { useState, useMemo } from 'react'
import { Award, TrendingUp, Calendar, Star, Zap, Target, BookOpen } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useUsers } from '../hooks/useUsers'
import { useResults } from '../hooks/useResults'

const BADGES = [
  { id: 1, icon: '🏆', name: 'Top Scorer',        desc: 'Scored 90%+ on 5 quizzes',          earned: true  },
  { id: 2, icon: '⭐', name: 'Star Learner',       desc: 'Completed 10 quizzes',              earned: true  },
  { id: 3, icon: '🎯', name: 'Sharpshooter',       desc: '5 perfect scores',                  earned: true  },
  { id: 4, icon: '🔥', name: 'On a Roll',          desc: '7-day learning streak',             earned: true  },
  { id: 5, icon: '📚', name: 'Bookworm',           desc: 'Completed all available quizzes',   earned: false },
  { id: 6, icon: '⚡', name: 'Speed Demon',        desc: 'Finished a quiz in under 5 minutes',earned: false },
  { id: 7, icon: '🎓', name: 'Certified Pro',      desc: 'Earned 5 certificates',             earned: false },
  { id: 8, icon: '💡', name: 'Quick Learner',      desc: 'Passed a quiz on first attempt, 10 times', earned: false },
]

const skills = [
  { name: 'JavaScript',    pct: 88, color: '#6366f1' },
  { name: 'Cloud/AWS',     pct: 72, color: '#06b6d4' },
  { name: 'Security',      pct: 65, color: '#f59e0b' },
  { name: 'Management',    pct: 80, color: '#22c55e' },
  { name: 'Data Science',  pct: 45, color: '#8b5cf6' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.value}%</p>)}
    </div>
  )
}

export default function UserProgressPage() {
  const { users, loading: usersLoading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Default to first active user once loaded
  const activeUsers = users.filter(u => u.status === 'active' || !u.status)
  const effectiveUserId = selectedUserId ?? activeUsers[0]?.id ?? null

  const { results, loading: resultsLoading } = useResults(
    effectiveUserId ? { userId: effectiveUserId } : {}
  )

  const user = users.find(u => u.id === effectiveUserId) ?? null

  // Build score history chart data from real attempts
  const scoreHistory = useMemo(() => {
    return [...results]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12)
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: r.score,
        quiz: r.quizTitle,
      }))
  }, [results])

  // Compute stats from real data
  const quizzesTaken = user?.profile_stats?.quizzes_taken ?? results.length
  const avgScore = user?.profile_stats?.avg_score
    ?? (results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0)
  const certificates = user?.profile_stats?.certificates ?? 0

  const userName = user?.name ?? '—'
  const email = user?.email ?? ''
  const department = user?.department ?? ''
  const role = user?.role ?? ''
  const initials = userName !== '—' ? userName.split(' ').map(n => n[0]).join('') : '?'

  const loading = usersLoading

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-6 h-[56px] flex items-center gap-3">
          <Award className="w-4 h-4 text-[#E63E6D]" />
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">User Progress</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Individual learner analytics</p>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Users list + select current user */}
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3">Viewing progress for:</p>
          {usersLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-[#E63E6D] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Loading users…</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${u.id === effectiveUserId ? 'bg-[#E63E6D] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#FFB3C6]'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${u.id === effectiveUserId ? 'bg-[#FF6B9D] text-white' : 'bg-[#FFE5EC] text-[#E63E6D]'}`}>{u.name?.[0] ?? '?'}</div>
                  {u.name?.split(' ')[0] ?? 'User'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile header */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE5EC] flex items-center justify-center text-xl font-bold text-[#E63E6D] flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{userName}</h2>
            <p className="text-sm text-slate-500">{email}{department ? ` · ${department}` : ''}{role ? ` · ${role}` : ''}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center flex-shrink-0">
            <div><p className="text-2xl font-bold text-[#E63E6D]">{quizzesTaken}</p><p className="text-xs text-slate-500">Quizzes</p></div>
            <div><p className="text-2xl font-bold text-green-600">{certificates}</p><p className="text-xs text-slate-500">Certs</p></div>
            <div><p className="text-2xl font-bold text-amber-600">{avgScore}%</p><p className="text-xs text-slate-500">Avg Score</p></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Score over time */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#FF6B9D]" /> Score History</h3>
            {resultsLoading ? (
              <div className="h-[180px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#E63E6D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scoreHistory.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No attempts yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={scoreHistory} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[50, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Skills */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-[#FF6B9D]" /> Skill Levels</h3>
            <div className="space-y-3">
              {skills.map(s => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span className="font-medium">{s.name}</span><span>{s.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Badges & achievements */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-heading text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Badges & Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BADGES.map(b => (
              <div key={b.id} className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${b.earned ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50 opacity-40'}`}>
                <span className="text-3xl mb-1">{b.icon}</span>
                <p className={`text-xs font-bold ${b.earned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity timeline */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-heading text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#FF6B9D]" /> Recent Activity</h3>
          {resultsLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-[#E63E6D] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Loading…</span>
            </div>
          ) : scoreHistory.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {[...scoreHistory].reverse().slice(0, 6).map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.score >= 70 ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-slate-400 w-20 flex-shrink-0">{a.date}</span>
                  <span className="text-sm text-slate-700 flex-1">{a.quiz}</span>
                  <span className={`text-xs font-semibold ${a.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>{a.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats: streak, time invested */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Zap,      iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',  label: 'Current Streak', value: '7 days'    },
            { icon: Target,   iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   label: 'Time Invested',  value: '14.5 hrs'  },
            { icon: BookOpen, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',label: 'This Month',     value: `${results.filter(r => { const d = new Date(r.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length} quizzes` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.iconBg}`}>
                <s.icon className={`w-[18px] h-[18px] ${s.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{s.value}</p>
              <p className="text-[13px] text-slate-500 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
