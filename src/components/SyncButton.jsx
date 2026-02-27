import { RefreshCw } from 'lucide-react'

function fmtSynced(date) {
  if (!date) return null
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 10) return 'Just synced'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export default function SyncButton({ lastSynced, syncing, onSync }) {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors disabled:opacity-60"
    >
      <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-[#E63E6D]' : ''}`} />
      {syncing ? 'Syncing…' : lastSynced ? `Synced ${fmtSynced(lastSynced)}` : 'Sync'}
    </button>
  )
}
