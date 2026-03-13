import { useState } from 'react'
import { X, Upload, AlertCircle, Check, Loader } from 'lucide-react'

const SOURCES = [
  { id: 'proprofs', name: 'ProProfs', placeholder: 'https://www.proprofs.com/quiz-school/story.php?...' },
  { id: 'google-forms', name: 'Google Forms', placeholder: 'https://forms.google.com/d/e/...' },
  { id: 'typeform', name: 'Typeform', placeholder: 'https://form.typeform.com/to/...' },
  { id: 'generic', name: 'Other URL', placeholder: 'https://example.com/quiz' },
]

export default function UniversalImporter({ isOpen, onClose }) {
  const [source, setSource] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const currentSource = SOURCES.find(s => s.id === source)

  function validateUrl() {
    if (!source) {
      setError('Please select a source')
      return false
    }
    if (!url.trim()) {
      setError('Please enter a URL')
      return false
    }

    // Validate based on source
    const validation = {
      proprofs: url.includes('proprofs.com'),
      'google-forms': url.includes('forms.google.com'),
      typeform: url.includes('typeform.com'),
      generic: url.startsWith('http')
    }

    if (!validation[source]) {
      setError(`Please enter a valid ${currentSource.name} URL`)
      return false
    }

    return true
  }

  async function handleImport() {
    if (!validateUrl()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ source, url: url.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to import quiz')
        return
      }

      setSuccess({
        title: data.quiz.title,
        questionCount: data.questionCount,
        quizId: data.quiz.id
      })
      setUrl('')
      setSource('')
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Import Quiz</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Import From</label>
            <select
              value={source}
              onChange={e => { setSource(e.target.value); setError(null); setUrl('') }}
              disabled={loading}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B9D] text-sm"
            >
              <option value="">Select a source...</option>
              {SOURCES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* URL Input */}
          {source && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Paste Quiz URL</label>
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(null) }}
                onKeyPress={e => e.key === 'Enter' && handleImport()}
                placeholder={currentSource.placeholder}
                disabled={loading}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B9D] text-sm"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-700">
                <p className="font-medium">Quiz imported successfully!</p>
                <p className="text-xs mt-0.5">{success.title} ({success.questionCount} questions)</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !source}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all flex items-center justify-center gap-2 ${
              loading || !source
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C]'
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
