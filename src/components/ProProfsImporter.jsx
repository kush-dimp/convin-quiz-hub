import { useState } from 'react'
import { Upload, AlertCircle, Check, Loader } from 'lucide-react'

export default function ProProfsImporter() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  async function handleImport() {
    if (!url.trim()) {
      setError('Please enter a ProProfs quiz URL')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/import-proprofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: url.trim() })
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
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ProProfs Quiz Importer</h1>
              <p className="text-sm text-slate-500 mt-0.5">Paste a ProProfs quiz URL to import it</p>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-semibold text-slate-700">Quiz URL</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleImport()}
              placeholder="https://www.proprofs.com/quiz-school/story.php?title=xyz"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B9D] text-sm"
              disabled={loading}
            />
            <p className="text-xs text-slate-500">Example: https://www.proprofs.com/quiz-school/story.php?title=xyz</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-emerald-900">Quiz imported successfully!</p>
                <p className="text-sm text-emerald-700 mt-1">
                  <strong>{success.title}</strong> ({success.questionCount} questions)
                </p>
                <a
                  href={`/quizzes/${success.quizId}/editor`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
                >
                  Edit quiz →
                </a>
              </div>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              loading || !url.trim()
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
                Import Quiz
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-600 font-medium mb-2">How it works:</p>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Paste your ProProfs quiz URL above</li>
              <li>We'll automatically fetch all questions and options</li>
              <li>Quiz will be created in draft mode for you to review</li>
              <li>You can edit questions and settings before publishing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
