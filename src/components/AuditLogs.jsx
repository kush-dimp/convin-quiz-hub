import { useState } from 'react'
import { Activity, Download, Search, RefreshCw, AlertTriangle, Info, AlertCircle, XOctagon, Shield } from 'lucide-react'
import { useAuditLogs } from '../hooks/useAuditLogs'

const severityConfig = {
  info:     { color: 'text-blue-600 bg-blue-50',    icon: Info,           dot: 'bg-blue-400'   },
  warning:  { color: 'text-amber-700 bg-amber-50',  icon: AlertTriangle,  dot: 'bg-amber-400'  },
  error:    { color: 'text-red-600 bg-red-50',       icon: AlertCircle,   dot: 'bg-red-500'    },
  critical: { color: 'text-red-700 bg-red-100',      icon: XOctagon,      dot: 'bg-red-700'    },
}

function actionColor(action = '') {
  if (action.includes('delete') || action.includes('deactivat')) return 'text-red-600'
  if (action.includes('login_failed') || action.includes('rate_limit')) return 'text-red-600'
  if (action.includes('login'))    return 'text-emerald-700'
  if (action.includes('publish'))  return 'text-emerald-700'
  if (action.includes('create') || action.includes('created')) return 'text-[#C41E5C]'
  if (action.includes('role'))     return 'text-violet-700'
  if (action.includes('export'))   return 'text-teal-700'
  if (action.includes('settings') || action.includes('changed')) return 'text-amber-700'
  if (action.includes('cert'))     return 'text-blue-700'
  if (action.includes('backup'))   return 'text-slate-500'
  return 'text-slate-700'
}

export default function AuditLogs() {
  const [search, setSearch]       = useState('')
  const [filterSev, setFilterSev] = useState('all')
  const [live, setLive]           = useState(false)

  const { logs: rawLogs, loading } = useAuditLogs({ live })

  const filtered = rawLogs.filter(l => {
    if (filterSev !== 'all' && l.severity !== filterSev) return false
    const q = search.toLowerCase()
    return !q || l.user_name?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q) || l.resource?.toLowerCase().includes(q) || l.ip_address?.includes(q)
  })

  function exportCSV() {
    const headers = ['Time', 'User', 'Action', 'Resource', 'Severity', 'IP', 'Details']
    const rows = filtered.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.user_name,
      l.action,
      l.resource,
      l.severity,
      l.ip_address,
      l.metadata ? JSON.stringify(l.metadata) : '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'audit-logs.csv',
    })
    a.click()
  }

  const counts = {
    all:      rawLogs.length,
    info:     rawLogs.filter(l => l.severity === 'info').length,
    warning:  rawLogs.filter(l => l.severity === 'warning').length,
    error:    rawLogs.filter(l => l.severity === 'error').length,
    critical: rawLogs.filter(l => l.severity === 'critical').length,
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Audit Logs</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">System activity and security events</p>
            </div>
            <span className="text-xs text-slate-400">({filtered.length} events)</span>
            {live && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />LIVE</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLive(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${live ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <RefreshCw className={`w-3.5 h-3.5 ${live ? 'animate-spin' : ''}`} />
              {live ? 'Stop Feed' : 'Live Feed'}
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Retention notice */}
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          Audit logs are retained for <strong className="mx-1">90 days</strong>. Logs older than 90 days are automatically archived to cold storage.
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { sev: 'all',      label: 'All Events', color: 'text-slate-700'  },
            { sev: 'info',     label: 'Info',       color: 'text-blue-600'   },
            { sev: 'warning',  label: 'Warning',    color: 'text-amber-700'  },
            { sev: 'error',    label: 'Error',      color: 'text-red-600'    },
            { sev: 'critical', label: 'Critical',   color: 'text-red-700'    },
          ].map(s => (
            <button key={s.sev} onClick={() => setFilterSev(s.sev)}
              className={`bg-white rounded-2xl p-4 shadow-sm text-left transition-all ${filterSev === s.sev ? 'ring-2 ring-[#FFB3C6]' : ''}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{counts[s.sev]}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, resource, IP…"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
        </div>

        {/* Log Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-2.5 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-24 flex-shrink-0" />
                  <div className="h-3 bg-slate-100 rounded w-28" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-20 hidden md:block" />
                  <div className="h-4 bg-slate-100 rounded w-14" />
                  <div className="h-3 bg-slate-100 rounded w-24 hidden lg:block" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-36">Time</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Resource</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map(l => {
                    const cfg = severityConfig[l.severity] || severityConfig.info
                    const SevIcon = cfg.icon
                    const ts = new Date(l.created_at)
                    return (
                      <tr key={l.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${l.severity === 'critical' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap font-mono">
                          {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <div className="text-[9px] text-slate-300">{ts.toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="text-[13px] font-semibold text-slate-800">{l.user_name}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`text-[13px] font-semibold ${actionColor(l.action)}`}>{l.action}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-400 hidden md:table-cell max-w-32 truncate">{l.resource}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${cfg.color}`}>
                            <SevIcon className="w-2.5 h-2.5" />
                            {l.severity}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-400 font-mono hidden lg:table-cell">{l.ip_address}</td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-400 hidden lg:table-cell max-w-40 truncate" title={l.metadata ? JSON.stringify(l.metadata) : ''}>
                          {l.metadata ? JSON.stringify(l.metadata) : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-400">
              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              No log entries match your search
            </div>
          )}
          {!loading && filtered.length > 100 && (
            <div className="px-5 py-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
              Showing 100 of {filtered.length} entries. Export CSV for full data.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
