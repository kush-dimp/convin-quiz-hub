import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, Search, Star, Clock, HelpCircle, Users, X, ChevronRight,
  Zap, BookOpen, Briefcase, Award, ClipboardList, BarChart2, Plus,
  CheckCircle2, FileText, ToggleLeft, AlignLeft, Activity,
} from 'lucide-react'
import { mockTemplates, TEMPLATE_CATEGORIES } from '../data/mockTemplates'
import { useQuizzes } from '../hooks/useQuizzes'

/* ── Category visual config ── */
const CATEGORY_THEME = {
  'Education':          { gradient: 'from-blue-500 to-cyan-400',    light: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',    icon: BookOpen },
  'Corporate Training': { gradient: 'from-orange-500 to-amber-400', light: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-100',  icon: Briefcase },
  'Certification':      { gradient: 'from-violet-500 to-purple-400',light: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-100',  icon: Award },
  'Assessment':         { gradient: 'from-emerald-500 to-teal-400', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: ClipboardList },
  'Survey':             { gradient: 'from-rose-500 to-pink-400',    light: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100',    icon: BarChart2 },
}
function theme(category) { return CATEGORY_THEME[category] ?? { gradient: 'from-[#FF6B9D] to-[#E63E6D]', light: 'bg-[#FFF5F7]', text: 'text-[#C41E5C]', border: 'border-[#FFE5EC]', icon: Layers } }

/* ── Question type pill config ── */
const TYPE_META = {
  mcq:    { label: 'MCQ',    color: 'bg-blue-50 text-blue-600',     icon: CheckCircle2 },
  tf:     { label: 'T/F',    color: 'bg-emerald-50 text-emerald-600', icon: ToggleLeft },
  fill:   { label: 'Fill',   color: 'bg-amber-50 text-amber-600',   icon: FileText },
  rating: { label: 'Rating', color: 'bg-violet-50 text-violet-600', icon: Activity },
  essay:  { label: 'Essay',  color: 'bg-slate-100 text-slate-600',  icon: AlignLeft },
}

function uniqueTypes(questions) {
  const seen = new Set()
  return questions.filter(q => { if (seen.has(q.type)) return false; seen.add(q.type); return true }).map(q => q.type)
}

/* ── Convert template question → DB question format ── */
function templateQToDb(q, i) {
  const typeMap = { mcq: 'mcq_single', tf: 'true_false', fill: 'fill_blank', rating: 'rating', essay: 'essay' }
  const type = typeMap[q.type] || q.type
  let payload = {}
  if (q.type === 'mcq')    payload = { options: q.options, correctIndex: q.answer }
  if (q.type === 'tf')     payload = { correctAnswer: q.answer }
  if (q.type === 'fill')   payload = { correctAnswer: q.answer, caseSensitive: false }
  if (q.type === 'rating') payload = { scale: q.scale ?? 5 }
  return { type, text: q.text, points: 10, difficulty: 'Medium', topic: 'General', explanation: '', payload, position: i }
}

/* ── Star rating display ── */
function StarRating({ value, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-0.5">{value} ({count})</span>
    </div>
  )
}

/* ── Template card ── */
function TemplateCard({ template, onPreview, onUse, loading }) {
  const t = theme(template.category)
  const Icon = t.icon
  const types = uniqueTypes(template.questions)

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200 group flex flex-col">
      {/* Thumbnail */}
      <div className={`h-36 bg-gradient-to-br ${t.gradient} flex items-center justify-center relative overflow-hidden flex-shrink-0`}>
        {/* decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/10" />
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <span className="text-white/90 text-[11px] font-semibold tracking-wide">{template.category.toUpperCase()}</span>
        </div>
        {/* badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1">
          {template.isOfficial && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#C41E5C] shadow-sm">Official</span>
          )}
          {template.isCommunity && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-emerald-700 shadow-sm">Community</span>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 text-[10px] font-semibold text-white/90 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {template.uses.toLocaleString()} uses
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-[13px] leading-snug line-clamp-1">{template.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed flex-1">{template.description}</p>

        {/* Question type chips */}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {types.map(type => {
            const m = TYPE_META[type] ?? { label: type, color: 'bg-slate-100 text-slate-500', icon: HelpCircle }
            const TIcon = m.icon
            return (
              <span key={type} className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${m.color}`}>
                <TIcon className="w-2.5 h-2.5" /> {m.label}
              </span>
            )
          })}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
          <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{template.questionCount}q</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{template.estimatedMinutes}m</span>
        </div>
        <div className="mt-1.5"><StarRating value={template.rating} count={template.ratingCount} /></div>

        {/* Actions */}
        <div className="flex gap-2 mt-3.5">
          <button
            onClick={() => onPreview(template)}
            className="flex-1 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => onUse(template)}
            disabled={loading}
            className={`flex-1 py-1.5 text-xs font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm bg-gradient-to-r ${t.gradient} hover:opacity-90 disabled:opacity-50`}
          >
            <Zap className="w-3 h-3" /> Use
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Preview modal ── */
function PreviewModal({ template, onClose, onUse, loading }) {
  const [userRating, setUserRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [rated, setRated] = useState(false)
  if (!template) return null
  const t = theme(template.category)
  const Icon = t.icon

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Hero header */}
        <div className={`bg-gradient-to-br ${t.gradient} px-6 py-5 flex-shrink-0 relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">{template.name}</h2>
                {template.isOfficial && <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 text-white rounded-full">Official</span>}
                {template.isCommunity && <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 text-white rounded-full">Community</span>}
              </div>
              <p className="text-white/80 text-xs mt-0.5">{template.category} · By {template.author}</p>
              <div className="flex gap-4 mt-2 text-white/90 text-xs font-medium">
                <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{template.questionCount} questions</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{template.estimatedMinutes} min</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{template.uses.toLocaleString()} uses</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">{template.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {template.tags.map(tag => (
              <span key={tag} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${t.light} ${t.text} border ${t.border}`}>{tag}</span>
            ))}
          </div>

          {/* Sample questions */}
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-800 mb-3">Sample Questions</h3>
            <div className="space-y-2.5">
              {template.questions.map((q, i) => {
                const m = TYPE_META[q.type] ?? { label: q.type, color: 'bg-slate-100 text-slate-500', icon: HelpCircle }
                const TIcon = m.icon
                return (
                  <div key={q.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div className="flex items-start gap-2">
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 ${m.color}`}>
                        <TIcon className="w-2.5 h-2.5" /> {m.label}
                      </span>
                      <p className="text-xs font-semibold text-slate-700 flex-1">Q{i + 1}: {q.text}</p>
                    </div>
                    {q.options && (
                      <div className="mt-2 grid grid-cols-2 gap-1 ml-8">
                        {q.options.map((o, idx) => (
                          <span key={idx} className={`text-[11px] px-2.5 py-1.5 rounded-lg border ${idx === q.answer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold' : 'bg-white border-slate-200 text-slate-500'}`}>
                            {idx === q.answer && '✓ '}{o}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.type === 'tf' && (
                      <div className="flex gap-2 mt-2 ml-8">
                        <span className={`text-[11px] px-3 py-1 rounded-lg border font-semibold ${q.answer === true ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>✓ True</span>
                        <span className={`text-[11px] px-3 py-1 rounded-lg border font-semibold ${q.answer === false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>✗ False</span>
                      </div>
                    )}
                    {q.type === 'fill' && (
                      <div className="mt-2 ml-8">
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">Answer: {q.answer}</span>
                      </div>
                    )}
                    {q.type === 'rating' && (
                      <div className="flex gap-1 mt-2 ml-8">
                        {Array.from({ length: q.scale ?? 5 }).map((_, n) => (
                          <div key={n} className="w-6 h-6 rounded-md bg-violet-100 border border-violet-200 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-violet-600">{n + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'essay' && (
                      <div className="mt-2 ml-8 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-[11px] text-slate-400 italic">Open-ended response…</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rate */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-sm font-bold text-slate-800">Rating</h3>
              <StarRating value={template.rating} count={template.ratingCount} />
            </div>
            {!rated ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 mr-1">Rate this template:</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`w-5 h-5 cursor-pointer transition-colors ${n <= (hover || userRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => { setUserRating(n); setRated(true) }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold">Thanks for rating! You gave {userRating} star{userRating > 1 ? 's' : ''}.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors">Close</button>
          <button
            onClick={() => { onUse(template); onClose() }}
            disabled={loading}
            className={`flex items-center gap-2 text-white px-5 py-2 rounded-xl text-[13px] font-semibold shadow-sm transition-all bg-gradient-to-r ${t.gradient} hover:opacity-90 disabled:opacity-50`}
          >
            <Zap className="w-4 h-4" /> Use This Template <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Save-as-template modal ── */
function SaveAsTemplateModal({ quiz, onClose }) {
  const [name, setName] = useState(`Template: ${quiz.title}`)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Education')
  const [saved, setSaved] = useState(false)

  if (saved) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="font-heading text-base font-bold text-slate-900">Template Saved!</h2>
        <p className="text-sm text-slate-500 mt-2">"{name}" is now available in the Template Library.</p>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] text-white text-sm font-semibold rounded-xl shadow-sm transition-all">Done</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
          <Plus className="w-5 h-5 text-[#E63E6D]" />
          <h2 className="font-heading text-base font-bold text-slate-900 flex-1">Save as Template</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Template Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe what this template is for…" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
              {TEMPLATE_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            This template will be added to the Community section and shared with all users.
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors">Cancel</button>
          <button onClick={() => setSaved(true)} disabled={!name.trim()} className="bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm transition-all disabled:opacity-40">Save Template</button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function TemplateLibrary() {
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('All')
  const [preview, setPreview]       = useState(null)
  const [saveAsSource, setSaveAsSource] = useState(null)
  const [loading, setLoading]       = useState(false)
  const { createQuiz } = useQuizzes()

  const filtered   = mockTemplates.filter(t =>
    (category === 'All' || t.category === category) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  )
  const official  = filtered.filter(t => !t.isCommunity)
  const community = filtered.filter(t => t.isCommunity)

  async function handleUse(template) {
    setLoading(true)
    try {
      const { data, error } = await createQuiz({
        title: template.name,
        description: template.description,
        category: template.category,
        status: 'draft',
        tags: template.tags ?? [],
      })
      if (error || !data?.id) { setLoading(false); return }

      // Seed sample questions into the quiz
      const dbQuestions = template.questions.map(templateQToDb)
      await fetch(`/api/quizzes/${data.id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbQuestions),
      })

      navigate(`/quizzes/${data.id}/editor`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {loading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-xl flex items-center gap-4">
            <div className="w-5 h-5 border-2 border-[#E63E6D] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-700">Creating quiz from template…</span>
          </div>
        </div>
      )}

      <header className="glass sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">Template Library</h1>
            <p className="text-[11px] text-white/60 mt-0.5">Start with a proven quiz structure</p>
          </div>
          <button
            onClick={() => setSaveAsSource({ title: 'My Quiz' })}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Save as Template
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TEMPLATE_CATEGORIES.map(c => {
              const active = category === c
              const t = c !== 'All' ? theme(c) : null
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? t ? `bg-gradient-to-r ${t.gradient} text-white shadow-sm` : 'bg-[#E63E6D] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* Official */}
        {official.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-heading text-sm font-bold text-white">Official Templates</h2>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold border border-white/30">Convin Team</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {official.map(t => <TemplateCard key={t.id} template={t} onPreview={setPreview} onUse={handleUse} loading={loading} />)}
            </div>
          </section>
        )}

        {/* Community */}
        {community.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-heading text-sm font-bold text-white">Community Templates</h2>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold border border-white/30">Community Contributed</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {community.map(t => <TemplateCard key={t.id} template={t} onPreview={setPreview} onUse={handleUse} loading={loading} />)}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Layers className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No templates found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search or category</p>
          </div>
        )}
      </main>

      <PreviewModal template={preview} onClose={() => setPreview(null)} onUse={handleUse} loading={loading} />
      {saveAsSource && <SaveAsTemplateModal quiz={saveAsSource} onClose={() => setSaveAsSource(null)} />}
    </div>
  )
}
