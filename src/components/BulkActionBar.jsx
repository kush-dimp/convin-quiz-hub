import { Trash2, Archive, FolderOpen, Download, RefreshCw, X } from 'lucide-react'

export default function BulkActionBar({
  selectedCount,
  totalDisplayed,
  allSelected,
  someSelected,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onArchive,
  onMove,
  onExport,
  onChangeStatus,
  bulkOp,
}) {
  const visible = selectedCount > 0
  const isProcessing = !!bulkOp

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 bg-white shadow-md transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {isProcessing ? (
          /* ── Processing state ── */
          <div className="flex items-center gap-4 px-2">
            <span className="text-sm text-gray-300">
              Processing{' '}
              <span className="font-semibold text-white">
                {bulkOp.progress}/{bulkOp.total}
              </span>{' '}
              quizzes…
            </span>
            <div className="w-40 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B9D] rounded-full transition-all duration-300"
                style={{ width: `${(bulkOp.progress / bulkOp.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          /* ── Normal state ── */
          <>
            {/* Left: Select-all checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={allSelected ? onDeselectAll : onSelectAll}
                  className="w-4 h-4 rounded accent-[#FF6B9D] cursor-pointer"
                />
              </span>
              <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                {selectedCount} selected
              </span>
            </label>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <ActionBtn
                icon={Archive}
                label="Archive"
                onClick={onArchive}
                color="text-orange-600 hover:bg-orange-50"
              />
              <ActionBtn
                icon={FolderOpen}
                label="Move"
                onClick={onMove}
                color="text-blue-600 hover:bg-blue-50"
              />
              <ActionBtn
                icon={RefreshCw}
                label="Status"
                onClick={onChangeStatus}
                color="text-purple-600 hover:bg-purple-50"
              />
              <ActionBtn
                icon={Download}
                label="Export"
                onClick={onExport}
                color="text-green-600 hover:bg-green-50"
              />
              <ActionBtn
                icon={Trash2}
                label="Delete"
                onClick={onDelete}
                color="text-red-600 hover:bg-red-50"
              />
              <button
                onClick={onDeselectAll}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-2 border-l border-slate-200"
                title="Deselect all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}
