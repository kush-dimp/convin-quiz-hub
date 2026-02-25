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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-max">

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
                className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${(bulkOp.progress / bulkOp.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          /* ── Normal state ── */
          <>
            {/* Select-all checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none pr-2 border-r border-gray-700">
              <span className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={allSelected ? onDeselectAll : onSelectAll}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">
                {selectedCount} selected
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <ActionBtn
                icon={Archive}
                label="Archive"
                onClick={onArchive}
                color="text-orange-300 hover:bg-orange-500/20"
              />
              <ActionBtn
                icon={FolderOpen}
                label="Move"
                onClick={onMove}
                color="text-blue-300 hover:bg-blue-500/20"
              />
              <ActionBtn
                icon={RefreshCw}
                label="Status"
                onClick={onChangeStatus}
                color="text-purple-300 hover:bg-purple-500/20"
              />
              <ActionBtn
                icon={Download}
                label="Export"
                onClick={onExport}
                color="text-green-300 hover:bg-green-500/20"
              />
              <ActionBtn
                icon={Trash2}
                label="Delete"
                onClick={onDelete}
                color="text-red-400 hover:bg-red-500/20"
              />
            </div>

            {/* Deselect */}
            <button
              onClick={onDeselectAll}
              className="ml-1 p-1.5 rounded-full text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
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
