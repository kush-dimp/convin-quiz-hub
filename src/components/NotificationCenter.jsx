import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, Settings, ClipboardList, Award, AlertTriangle, Info, Clock, X } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'

const typeConfig = {
  assignment:  { icon: ClipboardList, color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Assignment'  },
  reminder:    { icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Reminder'    },
  result:      { icon: Check,         color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Result'      },
  certificate: { icon: Award,         color: 'text-purple-600',  bg: 'bg-purple-50',  label: 'Certificate' },
  overdue:     { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50',     label: 'Overdue'     },
  system:      { icon: Info,          color: 'text-slate-500',   bg: 'bg-slate-100',  label: 'System'      },
}

const ALL_TYPES = ['assignment', 'reminder', 'result', 'certificate', 'overdue', 'system']

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(isoStr).toLocaleDateString()
}

function dateBucket(isoStr) {
  if (!isoStr) return 'Earlier'
  const diff = Date.now() - new Date(isoStr).getTime()
  const hours = diff / 3600000
  return hours < 48 ? 'Today' : 'Earlier'
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { notifications, loading, unreadCount, markRead, markAllRead, dismiss, dismissAllRead } = useNotifications(profile?.id)
  const [filter, setFilter]       = useState('all')
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('notif_prefs')
      if (stored) return JSON.parse(stored)
    } catch {}
    return Object.fromEntries(ALL_TYPES.map(t => [t, { inApp: true, email: t !== 'system' }]))
  })

  const displayed = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter !== 'all')    return n.type === filter
    return true
  })

  // Group by rough time bucket using created_at
  const groups = displayed.reduce((acc, n) => {
    const bucket = dateBucket(n.created_at)
    if (!acc[bucket]) acc[bucket] = []
    acc[bucket].push(n)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-3xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 leading-none">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full align-middle">{unreadCount}</span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Stay up to date with platform activity</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
              </button>
            )}
            <button onClick={dismissAllRead} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Clear Read
            </button>
            <button onClick={() => setShowPrefs(true)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'unread', ...ALL_TYPES].map(f => {
            const count = f === 'unread' ? unreadCount : f === 'all' ? notifications.length : notifications.filter(n => n.type === f).length
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors flex items-center gap-1 ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                {f.replace('_', ' ')}
                {count > 0 && <span className={`text-[10px] px-1 rounded ${filter === f ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="h-4 bg-slate-100 rounded w-56" />
                  <div className="h-3 bg-slate-100 rounded w-72" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notification list grouped by date */}
        {!loading && Object.keys(groups).length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">All caught up! No notifications here.</p>
          </div>
        )}

        {!loading && Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">{date}</p>
            <div className="space-y-2">
              {items.map(n => {
                const cfg = typeConfig[n.type] || typeConfig.system
                const Icon = cfg.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 bg-white rounded-2xl shadow-sm p-4 cursor-pointer transition-all ${!n.read ? 'border-l-4 border-l-indigo-400' : 'opacity-60'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 capitalize">{cfg.label}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                      {n.actionLabel && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            markRead(n.id)
                            const routes = { quiz: `/quizzes/${n.resource_id}/editor`, result: `/results/${n.resource_id}`, attempt: `/results/${n.resource_id}`, assignment: '/assignments' }
                            const route = routes[n.resource_type]
                            if (route) navigate(route)
                          }}
                          className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >{n.actionLabel} →</button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                      <button onClick={e => { e.stopPropagation(); dismiss(n.id) }} className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </main>

      {/* Preferences Panel */}
      {showPrefs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={e => e.target === e.currentTarget && setShowPrefs(false)}>
          <div className="bg-white h-full w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
              <Settings className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 flex-1">Notification Preferences</h2>
              <button onClick={() => setShowPrefs(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs text-slate-500 mb-4">Choose how you receive each type of notification.</p>
              <div className="space-y-1">
                <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2 py-1 mb-1">
                  <span>Type</span>
                  <span className="text-center">In-App</span>
                  <span className="text-center">Email</span>
                </div>
                {ALL_TYPES.map(type => {
                  const cfg = typeConfig[type]
                  const Icon = cfg.icon
                  return (
                    <div key={type} className="grid grid-cols-3 items-center bg-slate-50 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        <span className="text-xs font-medium text-slate-700 capitalize">{type}</span>
                      </div>
                      <div className="flex justify-center">
                        <button onClick={() => setPrefs(p => ({ ...p, [type]: { ...p[type], inApp: !p[type].inApp } }))}
                          className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${prefs[type].inApp ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform ${prefs[type].inApp ? 'translate-x-4' : ''}`} />
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <button onClick={() => setPrefs(p => ({ ...p, [type]: { ...p[type], email: !p[type].email } }))}
                          className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${prefs[type].email ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform ${prefs[type].email ? 'translate-x-4' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => { localStorage.setItem('notif_prefs', JSON.stringify(prefs)); setShowPrefs(false) }}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-indigo-200 transition-all">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
