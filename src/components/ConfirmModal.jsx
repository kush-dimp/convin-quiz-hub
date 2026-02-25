import { useState } from 'react'
import { AlertTriangle, Archive, FolderOpen, RefreshCw, X } from 'lucide-react'

const FOLDERS = ['Technology', 'HR & Compliance', 'Onboarding', 'Certifications', 'General']
const STATUSES = [
  { value: 'published', label: 'Published', dot: 'bg-green-500' },
  { value: 'draft',     label: 'Draft',     dot: 'bg-gray-400'  },
  { value: 'archived',  label: 'Archived',  dot: 'bg-orange-400' },
]

export default function ConfirmModal({ modal, onConfirm, onCancel }) {
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0])
  const [selectedStatus, setSelectedStatus] = useState('published')

  if (!modal) return null
  const { type, items } = modal
  const count = items.length

  /* ── Config per modal type ── */
  const config = {
    delete: {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      bg:   'bg-red-50',
      title: `Delete ${count} quiz${count !== 1 ? 'zes' : ''}?`,
      body:  'This action cannot be undone. The following quizzes will be permanently deleted:',
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    archive: {
      icon: <Archive className="w-6 h-6 text-orange-500" />,
      bg:   'bg-orange-50',
      title: `Archive ${count} quiz${count !== 1 ? 'zes' : ''}?`,
      body:  'Archived quizzes are hidden from learners but can be restored. Affected quizzes:',
      confirmLabel: 'Archive',
      confirmClass: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    move: {
      icon: <FolderOpen className="w-6 h-6 text-indigo-500" />,
      bg:   'bg-indigo-50',
      title: `Move ${count} quiz${count !== 1 ? 'zes' : ''} to folder`,
      body:  'Select the destination folder:',
      confirmLabel: 'Move',
      confirmClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    changeStatus: {
      icon: <RefreshCw className="w-6 h-6 text-blue-500" />,
      bg:   'bg-blue-50',
      title: `Change status of ${count} quiz${count !== 1 ? 'zes' : ''}`,
      body:  'Select the new status:',
      confirmLabel: 'Apply',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }[type]

  function handleConfirm() {
    if (type === 'move') onConfirm({ folder: selectedFolder })
    else if (type === 'changeStatus') onConfirm({ newStatus: selectedStatus })
    else onConfirm()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-5 ${config.bg}`}>
          {config.icon}
          <h2 className="text-base font-bold text-gray-900 flex-1">{config.title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-3">{config.body}</p>

          {/* Affected quiz list (delete / archive) */}
          {(type === 'delete' || type === 'archive') && (
            <ul className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-40 overflow-y-auto mb-1">
              {items.map((q) => (
                <li key={q.id} className="px-3 py-2 text-sm text-gray-700 truncate">
                  {q.title}
                </li>
              ))}
            </ul>
          )}

          {/* Folder picker */}
          {type === 'move' && (
            <div className="space-y-2 mb-1">
              {FOLDERS.map((f) => (
                <label
                  key={f}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedFolder === f
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="folder"
                    value={f}
                    checked={selectedFolder === f}
                    onChange={() => setSelectedFolder(f)}
                    className="accent-indigo-600"
                  />
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{f}</span>
                </label>
              ))}
            </div>
          )}

          {/* Status picker */}
          {type === 'changeStatus' && (
            <div className="space-y-2 mb-1">
              {STATUSES.map(({ value, label, dot }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedStatus === value
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={selectedStatus === value}
                    onChange={() => setSelectedStatus(value)}
                    className="accent-blue-600"
                  />
                  <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${config.confirmClass}`}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
