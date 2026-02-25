import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, Search, Star, Clock, HelpCircle, Users, X, ChevronRight,
  Zap, BookOpen, Briefcase, Award, ClipboardList, BarChart2, Plus,
} from 'lucide-react'
import { mockTemplates, TEMPLATE_CATEGORIES } from '../data/mockTemplates'
import { useQuizzes } from '../hooks/useQuizzes'

const CATEGORY_ICONS = {
  Education: BookOpen, 'Corporate Training': Briefcase,
  Certification: Award, Assessment: ClipboardList, Survey: BarChart2,
}

function StarRating({ value, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-0.5">{value} ({count})</span>
    </div>
  )
}

function TemplateCard({ template, onPreview, onUse }) {
  const Icon = CATEGORY_ICONS[template.category] || Layers
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-200 group">
      {/* Thumbnail */}
      <div className="h-32 bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-100 flex items-center justify-center relative">
        <Icon className="w-12 h-12 text-indigo-200 group-hover:text-indigo-300 transition-colors" />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-indigo-700 border border-indigo-100">
            {template.category}
          </span>
          {template.isOfficial && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">Official</span>
          )}
          {template.isCommunity && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Community</span>
          )}
        </div>
        <div className="absolute top-2 right-2 text-xs font-medium text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-lg">
          {template.uses.toLocaleString()} uses
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">{template.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{template.description}</p>

        <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
          <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{template.questionCount} questions</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{template.estimatedMinutes} min</span>
        </div>

        <div className="mt-2"><StarRating value={template.rating} count={template.ratingCount} /></div>

        <div className="flex gap-2 mt-3.5">
          <button
            onClick={() => onPreview(template)}
            className="flex-1 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => onUse(template)}
            className="flex-1 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm shadow-indigo-200"
          >
            <Zap className="w-3 h-3" /> Use Template
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ template, onClose, onUse }) {
  const [userRating, setUserRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [rated, setRated] = useState(false)
  if (!template) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">{template.name}</h2>
              {template.isOfficial && <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">Official</span>}
              {template.isCommunity && <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">Community</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{template.category} · By {template.author}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">{template.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600"><HelpCircle className="w-4 h-4 text-indigo-400" /><strong>{template.questionCount}</strong> questions</div>
            <div className="flex items-center gap-1.5 text-slate-600"><Clock className="w-4 h-4 text-indigo-400" /><strong>~{template.estimatedMinutes} min</strong> estimated</div>
            <div className="flex items-center gap-1.5 text-slate-600"><Users className="w-4 h-4 text-indigo-400" /><strong>{template.uses.toLocaleString()}</strong> uses</div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {template.tags.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>
            ))}
          </div>

          {/* Sample questions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Sample Questions</h3>
            <div className="space-y-2">
              {template.questions.map((q, i) => (
                <div key={q.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <p className="text-xs font-medium text-slate-700">Q{i + 1}: {q.text}</p>
                  {q.options && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      {q.options.map((o, idx) => (
                        <span key={idx} className={`text-[11px] px-2 py-1 rounded-lg border ${idx === q.answer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-white border-slate-200 text-slate-500'}`}>{o}</span>
                      ))}
                    </div>
                  )}
                  {q.answer === true && <span className="text-[11px] text-emerald-600 font-medium mt-1 block">✓ True</span>}
                  {q.answer === false && <span className="text-[11px] text-red-600 font-medium mt-1 block">✗ False</span>}
                  {typeof q.answer === 'string' && <span className="text-[11px] text-emerald-600 mt-1 block">Answer: {q.answer}</span>}
                </div>
              ))}
              {template.questionCount > template.questions.length && (
                <p className="text-xs text-slate-400 text-center py-2">+{template.questionCount - template.questions.length} more questions in full template</p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Rate This Template</h3>
            <StarRating value={template.rating} count={template.ratingCount} />
            {!rated ? (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-slate-500 mr-1">Your rating:</span>
                {[1,2,3,4,5].map(n => (
                  <Star
                    key={n}
                    className={`w-5 h-5 cursor-pointer transition-colors ${n <= (hover || userRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => { setUserRating(n); setRated(true) }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 mt-2 font-medium">Thanks for rating! You gave {userRating} stars.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5 flex-shrink-0">
          <button onClick={onClose} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors">Close</button>
          <button
            onClick={() => { onUse(template); onClose() }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-indigo-200 transition-all"
          >
            <Zap className="w-4 h-4" /> Use This Template <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SaveAsTemplateModal({ quiz, onClose }) {
  const [name, setName] = useState(`Template: ${quiz.title}`)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Education')
  const [saved, setSaved] = useState(false)
  if (saved) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Award className="w-7 h-7 text-emerald-500" /></div>
        <h2 className="text-base font-bold text-slate-900">Template Saved!</h2>
        <p className="text-sm text-slate-500 mt-2">"{name}" is now available in the Template Library.</p>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all">Done</button>
      </div>
    </div>
  )
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
          <Plus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 flex-1">Save as Template</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Template Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe what this template is for…" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200">
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
          <button onClick={() => setSaved(true)} disabled={!name.trim()} className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-indigo-200 transition-all disabled:opacity-40">Save Template</button>
        </div>
      </div>
    </div>
  )
}

export default function TemplateLibrary() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [preview, setPreview] = useState(null)
  const [saveAsSource, setSaveAsSource] = useState(null)
  const [creating, setCreating] = useState(false)
  const { createQuiz } = useQuizzes()

  const filtered = mockTemplates.filter(t =>
    (category === 'All' || t.category === category) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  )
  const official   = filtered.filter(t => !t.isCommunity)
  const community  = filtered.filter(t => t.isCommunity)

  async function handleUse(template) {
    setCreating(true)
    const { data, error } = await createQuiz({
      title: template.name,
      description: template.description,
      category: template.category,
      status: 'draft',
      tags: template.tags ?? [],
    })
    setCreating(false)
    if (!error && data?.id) {
      navigate(`/quizzes/${data.id}/editor`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {creating && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-xl flex items-center gap-4">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-700">Creating quiz from template…</span>
          </div>
        </div>
      )}
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-[56px] flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 leading-none">Template Library</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Start with a proven quiz structure</p>
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TEMPLATE_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${category === c ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Official Templates */}
        {official.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900">Official Templates</h2>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">ProProfs Team</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {official.map(t => <TemplateCard key={t.id} template={t} onPreview={setPreview} onUse={handleUse} />)}
            </div>
          </section>
        )}

        {/* Community Templates */}
        {community.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900">Community Templates</h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Community Contributed</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {community.map(t => <TemplateCard key={t.id} template={t} onPreview={setPreview} onUse={handleUse} />)}
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

      <PreviewModal template={preview} onClose={() => setPreview(null)} onUse={handleUse} />
      {saveAsSource && <SaveAsTemplateModal quiz={saveAsSource} onClose={() => setSaveAsSource(null)} />}
    </div>
  )
}
