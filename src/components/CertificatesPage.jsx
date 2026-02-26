import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Search, Printer, Trash2, Eye, X, RefreshCw, Settings, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import CertificateRenderer, { CERT_W, CERT_H } from './CertificateRenderer'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isExpired(expiresAt) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function isExpiringSoon(expiresAt) {
  if (!expiresAt) return false
  const d = new Date(expiresAt)
  const now = new Date()
  const diff = d - now
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

const TEMPLATE_LABELS = { classic: 'Classic', modern: 'Modern', minimalist: 'Minimalist', corporate: 'Corporate' }
const TEMPLATE_COLORS = { classic: 'from-amber-50 to-amber-100', modern: 'from-indigo-50 to-blue-100', minimalist: 'from-white to-slate-50', corporate: 'from-slate-50 to-slate-100' }

export default function CertificatesPage() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [quizzes, setQuizzes] = useState([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(true)

  const [search, setSearch] = useState('')
  const [quizFilter, setQuizFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [viewCert, setViewCert] = useState(null)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => { fetchCerts(); fetchQuizzes() }, [])

  async function fetchCerts() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/certificates')
      if (!res.ok) throw new Error('Failed to load certificates')
      const data = await res.json()
      setCerts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchQuizzes() {
    setQuizzesLoading(true)
    try {
      const res = await fetch('/api/quizzes')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuizzes(data)
    } catch {
      // non-fatal
    } finally {
      setQuizzesLoading(false)
    }
  }

  async function revoke(id) {
    setRevoking(true)
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke')
      setCerts(prev => prev.filter(c => c.id !== id))
      setRevokeTarget(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setRevoking(false)
    }
  }

  // Derived stats
  const stats = useMemo(() => {
    const total    = certs.length
    const active   = certs.filter(c => !isExpired(c.expires_at)).length
    const expiring = certs.filter(c => isExpiringSoon(c.expires_at)).length
    const expired  = certs.filter(c => isExpired(c.expires_at)).length
    return { total, active, expiring, expired }
  }, [certs])

  // Unique quiz titles for filter dropdown
  const quizTitles = useMemo(() =>
    [...new Set(certs.map(c => c.quiz_title).filter(Boolean))].sort()
  , [certs])

  // Filtered list
  const filtered = useMemo(() => {
    return certs.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.user_name?.toLowerCase().includes(q) || c.user_email?.toLowerCase().includes(q) || c.quiz_title?.toLowerCase().includes(q)
      const matchQuiz   = !quizFilter || c.quiz_title === quizFilter
      const matchStatus =
        statusFilter === 'all'    ? true :
        statusFilter === 'active' ? !isExpired(c.expires_at) :
        statusFilter === 'expired'? isExpired(c.expires_at)  : true
      return matchSearch && matchQuiz && matchStatus
    })
  }, [certs, search, quizFilter, statusFilter])


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">Certificates</h1>
              <p className="text-xs text-slate-400 mt-0.5">Issued completion certificates</p>
            </div>
          </div>
          {/* Stats chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Total',        value: stats.total,    color: 'bg-slate-100 text-slate-700' },
              { label: 'Active',       value: stats.active,   color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Expiring',     value: stats.expiring, color: 'bg-amber-100 text-amber-700' },
              { label: 'Expired',      value: stats.expired,  color: 'bg-red-100 text-red-700' },
            ].map(s => (
              <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.color}`}>
                {s.value} {s.label}
              </span>
            ))}
            <button onClick={fetchCerts} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* ── Configure Templates section ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setConfigOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Settings className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">Configure Certificate Templates</p>
                <p className="text-xs text-slate-400">Jump to certificate settings for quizzes with templates configured</p>
              </div>
            </div>
            {configOpen
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {configOpen && (
            <div className="border-t border-slate-100 px-5 py-4">
              {quizzesLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (() => {
                const certQuizzes = quizzes.filter(q => q.certificate_enabled)
                if (certQuizzes.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Settings className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 mb-1">No quizzes have certificates enabled</p>
                      <p className="text-xs text-slate-400">Go to any quiz's Settings → Certificate tab to enable and design a template.</p>
                    </div>
                  )
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {certQuizzes.map(quiz => {
                      let tpl = {}
                      try { tpl = JSON.parse(quiz.certificate_template || '{}') } catch {}
                      const tplKey    = tpl.template || 'classic'
                      const color     = tpl.primaryColor || '#4F46E5'
                      const gradClass = TEMPLATE_COLORS[tplKey] || TEMPLATE_COLORS.classic

                      return (
                        <div key={quiz.id} className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-4 flex flex-col gap-3">
                          {/* Mini template preview */}
                          <div className={`h-14 rounded-lg bg-gradient-to-br ${gradClass} border flex items-center justify-center relative overflow-hidden`}
                               style={{ borderColor: color + '55' }}>
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" style={{ background: color }} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              {TEMPLATE_LABELS[tplKey]}
                            </span>
                          </div>

                          {/* Quiz info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate" title={quiz.title}>{quiz.title}</p>
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                              <span className="w-3 h-3 rounded-full inline-block border border-white shadow-sm flex-shrink-0" style={{ background: color }} />
                              {TEMPLATE_LABELS[tplKey]}
                            </span>
                          </div>

                          {/* Configure button */}
                          <Link
                            to={`/quizzes/${quiz.id}/settings`}
                            state={{ tab: 'certificate' }}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Edit Template
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or quiz…"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={quizFilter}
            onChange={e => setQuizFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none min-w-[160px]"
          >
            <option value="">All Quizzes</option>
            {quizTitles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No certificates found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issued</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((cert, idx) => {
                  const expired = isExpired(cert.expires_at)
                  const expiring = isExpiringSoon(cert.expires_at)
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">{cert.user_name || '—'}</p>
                        <p className="text-xs text-slate-400">{cert.user_email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium max-w-[200px] truncate">{cert.quiz_title || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{formatDate(cert.issued_at)}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {cert.expires_at ? formatDate(cert.expires_at) : <span className="text-slate-400">Never</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          expired  ? 'bg-red-100 text-red-700'    :
                          expiring ? 'bg-amber-100 text-amber-700' :
                                     'bg-emerald-100 text-emerald-700'
                        }`}>
                          {expired ? 'Expired' : expiring ? 'Expiring' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewCert(cert)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => setRevokeTarget(cert)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Certificate Modal */}
      {viewCert && (() => {
        let tpl = {}
        try { tpl = JSON.parse(viewCert.certificate_template || '{}') } catch {}
        // Reserve space for button bar (≈52px) + gaps + padding
        const availW = window.innerWidth  * 0.92
        const availH = window.innerHeight * 0.92 - 64
        const scale   = Math.min(availW / CERT_W, availH / CERT_H, 1)
        const scaledW = Math.round(CERT_W * scale)
        const scaledH = Math.round(CERT_H * scale)
        return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-4 gap-4">
            {/* Buttons — always visible above cert */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors shadow"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button
                onClick={() => setViewCert(null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
            {/* Wrapper sized to scaled dimensions so it occupies correct layout space */}
            <div style={{
              position: 'relative',
              width: scaledW,
              height: scaledH,
              flexShrink: 0,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: CERT_W, height: CERT_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}>
                <CertificateRenderer
                  cert={viewCert}
                  quizTitle={viewCert.quiz_title}
                  userName={viewCert.user_name}
                  scorePct={null}
                  template={tpl.template}
                  primaryColor={tpl.primaryColor}
                />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Revoke Confirm Dialog */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Revoke Certificate?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              This will permanently delete the certificate for <strong>{revokeTarget.user_name}</strong> on <strong>{revokeTarget.quiz_title}</strong>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => revoke(revokeTarget.id)}
                disabled={revoking}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {revoking ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
