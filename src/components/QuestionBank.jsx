import { useState, useEffect } from 'react'
import { Database, Search, Plus, Edit2, Trash2, Copy, Download, X, Check, Upload } from 'lucide-react'
import { QUESTION_TYPES, DIFFICULTY_LEVELS, TOPICS } from '../data/mockQuestions'
import QuestionImportModal from './QuestionImport'

const diffColor = {
  Easy:   'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  Hard:   'bg-red-50 text-red-600',
  Expert: 'bg-violet-50 text-violet-700',
}

function emptyForm() {
  return {
    text: '', type: 'mcq_single', difficulty: 'Medium', topic: 'General',
    points: 10, explanation: '',
    options: ['', '', '', ''], correctIndex: 0, correctIndices: [],
    correctAnswer: null, caseSensitive: false,
    sampleAnswer: '',
    scale: 5,
    pairs: [{ left: '', right: '' }, { left: '', right: '' }],
    items: ['', '', ''],
  }
}

function flattenRow(q) {
  const p = q.payload ?? {}
  return {
    id: q.id,
    text: q.text ?? '',
    type: q.type ?? 'mcq_single',
    difficulty: q.difficulty ?? 'Medium',
    topic: q.topic ?? 'General',
    points: q.points ?? 10,
    explanation: q.explanation ?? '',
    options: p.options ?? ['', '', '', ''],
    correctIndex: p.correctIndex ?? 0,
    correctIndices: p.correctIndices ?? [],
    correctAnswer: p.correctAnswer ?? null,
    caseSensitive: p.caseSensitive ?? false,
    sampleAnswer: p.sampleAnswer ?? '',
    scale: p.scale ?? 5,
    pairs: p.pairs ?? [{ left: '', right: '' }, { left: '', right: '' }],
    items: p.items ?? ['', '', ''],
  }
}

function buildPayload(f) {
  if (f.type === 'mcq_single') return { options: f.options, correctIndex: f.correctIndex }
  if (f.type === 'mcq_multi')  return { options: f.options, correctIndices: f.correctIndices }
  if (f.type === 'true_false') return { correctAnswer: f.correctAnswer }
  if (f.type === 'fill_blank') return { correctAnswer: f.correctAnswer, caseSensitive: f.caseSensitive }
  if (f.type === 'short' || f.type === 'essay') return { sampleAnswer: f.sampleAnswer ?? '' }
  if (f.type === 'rating')    return { scale: f.scale ?? 5 }
  if (f.type === 'matching')  return { pairs: f.pairs ?? [] }
  if (f.type === 'ordering')  return { items: f.items ?? [] }
  return {}
}

/* ── Answer editor ── */
function AnswerEditor({ form, onChange }) {
  function upd(field, val) { onChange({ ...form, [field]: val }) }

  if (form.type === 'mcq_single' || form.type === 'mcq_multi') {
    const isMulti = form.type === 'mcq_multi'
    const options = form.options?.length ? form.options : ['', '', '', '']
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Answer Options</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              onClick={() => {
                if (isMulti) {
                  const ci = form.correctIndices ?? []
                  upd('correctIndices', ci.includes(i) ? ci.filter(x => x !== i) : [...ci, i])
                } else {
                  upd('correctIndex', i)
                }
              }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${
                isMulti
                  ? (form.correctIndices ?? []).includes(i) ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-slate-400'
                  : form.correctIndex === i ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {((isMulti && (form.correctIndices ?? []).includes(i)) || (!isMulti && form.correctIndex === i)) && (
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </div>
            <input
              value={opt}
              onChange={e => { const o = [...options]; o[i] = e.target.value; upd('options', o) }}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
            />
            {options.length > 2 && (
              <button onClick={() => upd('options', options.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => upd('options', [...options, ''])} className="text-xs text-[#E63E6D] hover:text-[#C41E5C] font-medium flex items-center gap-1 mt-1">
          <Plus className="w-3.5 h-3.5" /> Add Option
        </button>
        {isMulti && <p className="text-[11px] text-slate-400">Click the circle to mark correct answers (multiple allowed)</p>}
      </div>
    )
  }

  if (form.type === 'true_false') return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Correct Answer</p>
      <div className="flex gap-3">
        {[true, false].map(v => (
          <button
            key={String(v)}
            onClick={() => upd('correctAnswer', v)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              form.correctAnswer === v ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {v ? '✓ True' : '✗ False'}
          </button>
        ))}
      </div>
    </div>
  )

  if (form.type === 'fill_blank') return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Correct Answer</p>
      <input
        value={form.correctAnswer ?? ''}
        onChange={e => upd('correctAnswer', e.target.value)}
        placeholder="Enter the correct answer"
        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
      />
      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={form.caseSensitive ?? false} onChange={e => upd('caseSensitive', e.target.checked)} className="rounded accent-[#E63E6D]" />
        Case sensitive
      </label>
    </div>
  )

  if (form.type === 'short' || form.type === 'essay') return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Sample Answer <span className="normal-case font-normal text-slate-400">(optional — for reference)</span>
      </p>
      <textarea
        value={form.sampleAnswer ?? ''}
        onChange={e => upd('sampleAnswer', e.target.value)}
        rows={form.type === 'essay' ? 4 : 2}
        placeholder={form.type === 'essay' ? 'Enter a model answer for reference…' : 'Enter the expected short answer…'}
        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50 resize-none"
      />
      <p className="text-[11px] text-slate-400">This question type requires manual grading.</p>
    </div>
  )

  if (form.type === 'rating') {
    const scale = form.scale ?? 5
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating Scale</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">1 to</span>
          <select
            value={scale}
            onChange={e => upd('scale', Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
          >
            {[3, 4, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-sm text-slate-600">points</span>
        </div>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {Array.from({ length: scale }, (_, i) => (
            <span key={i} className="w-8 h-8 rounded-lg bg-[#FFF5F7] text-[#E63E6D] text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (form.type === 'matching') {
    const pairs = form.pairs?.length ? form.pairs : [{ left: '', right: '' }, { left: '', right: '' }]
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Matching Pairs</p>
        {pairs.map((pair, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={pair.left}
              onChange={e => { const p = [...pairs]; p[i] = { ...p[i], left: e.target.value }; upd('pairs', p) }}
              placeholder={`Left ${i + 1}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
            />
            <span className="text-slate-400 text-sm flex-shrink-0">→</span>
            <input
              value={pair.right}
              onChange={e => { const p = [...pairs]; p[i] = { ...p[i], right: e.target.value }; upd('pairs', p) }}
              placeholder={`Right ${i + 1}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
            />
            {pairs.length > 2 && (
              <button onClick={() => upd('pairs', pairs.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => upd('pairs', [...pairs, { left: '', right: '' }])} className="text-xs text-[#E63E6D] hover:text-[#C41E5C] font-medium flex items-center gap-1 mt-1">
          <Plus className="w-3.5 h-3.5" /> Add Pair
        </button>
      </div>
    )
  }

  if (form.type === 'ordering') {
    const items = form.items?.length ? form.items : ['', '', '']
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items to Order</p>
        <p className="text-[11px] text-slate-400">Add items in the correct order</p>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FFF5F7] text-[#E63E6D] text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <input
              value={item}
              onChange={e => { const it = [...items]; it[i] = e.target.value; upd('items', it) }}
              placeholder={`Item ${i + 1}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
            />
            {items.length > 2 && (
              <button onClick={() => upd('items', items.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => upd('items', [...items, ''])} className="text-xs text-[#E63E6D] hover:text-[#C41E5C] font-medium flex items-center gap-1 mt-1">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>
    )
  }

  return <p className="text-sm text-slate-400 italic">This question type requires manual configuration in the quiz editor.</p>
}

/* ── Create / Edit modal ── */
function QuestionModal({ initial, onSave, onClose, saving }) {
  const isNew = !initial?.id
  const [form, setForm] = useState(initial ?? emptyForm())

  function handleTypeChange(type) {
    setForm(p => ({
      ...p, type,
      options: ['', '', '', ''], correctIndex: 0,
      correctIndices: [], correctAnswer: null,
      sampleAnswer: '',
      scale: 5,
      pairs: [{ left: '', right: '' }, { left: '', right: '' }],
      items: ['', '', ''],
    }))
  }

  function handleSave() {
    if (!form.text.trim()) return
    onSave({
      id: form.id,
      text: form.text,
      type: form.type,
      difficulty: form.difficulty,
      topic: form.topic,
      points: Number(form.points) || 10,
      explanation: form.explanation,
      payload: buildPayload(form),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-900">{isNew ? 'New Question' : 'Edit Question'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Question Text</label>
            <textarea
              autoFocus
              value={form.text}
              onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
              rows={3}
              placeholder="Enter your question…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Question Type</label>
            <select
              value={form.type}
              onChange={e => handleTypeChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
            >
              {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {/* Answer editor */}
          <AnswerEditor form={form} onChange={setForm} />

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50">
                {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Topic</label>
              <select value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50">
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Points</label>
              <input type="number" min="1" value={form.points}
                onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50" />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Explanation <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <textarea
              value={form.explanation}
              onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
              rows={2}
              placeholder="Explain why this answer is correct…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.text.trim() || saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] disabled:opacity-50 transition-all shadow-sm shadow-[#FFB3C6]"
          >
            {saving ? 'Saving…' : isNew ? 'Create Question' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDiff, setFilterDiff] = useState('all')
  const [filterTopic, setFilterTopic] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [modal, setModal] = useState(null)   // null | 'new' | flattenedQuestion
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/questions')
        const data = await res.json()
        setQuestions(Array.isArray(data) ? data : [])
      } catch (e) {
        setError('Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = questions.filter(q =>
    (filterType  === 'all' || q.type       === filterType) &&
    (filterDiff  === 'all' || q.difficulty === filterDiff) &&
    (filterTopic === 'all' || q.topic      === filterTopic) &&
    (q.text ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleSave(data) {
    setSaving(true)
    try {
      if (data.id) {
        // Edit existing
        const res = await fetch(`/api/questions/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to save')
        const updated = await res.json()
        setQuestions(prev => prev.map(q => q.id === data.id ? updated : q))
      } else {
        // Create new
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create')
        const created = await res.json()
        setQuestions(prev => [created, ...prev])
      }
      setModal(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy(q) {
    setSaving(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: q.text + ' (copy)',
          type: q.type,
          difficulty: q.difficulty,
          topic: q.topic,
          points: q.points,
          explanation: q.explanation,
          payload: q.payload ?? {},
        }),
      })
      if (!res.ok) throw new Error('Failed to duplicate')
      const created = await res.json()
      setQuestions(prev => [created, ...prev])
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id))
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
      }
    } catch (e) {
      setError(e.message)
    }
  }

  function exportSelected() {
    const qs = filtered.filter(q => selected.has(q.id))
    const csv = [['ID', 'Question', 'Type', 'Difficulty', 'Topic', 'Points']].concat(
      qs.map(q => [q.id, `"${(q.text ?? '').replace(/"/g, '""')}"`, q.type, q.difficulty, q.topic, q.points])
    )
    const blob = new Blob([csv.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'question-bank.csv' }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#E63E6D]" />
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-none">Question Bank</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{questions.length} questions total</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button
                onClick={exportSelected}
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Export ({selected.size})
              </button>
            )}
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
            <button
              onClick={() => setModal('new')}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-[#FFB3C6] transition-all"
            >
              <Plus className="w-4 h-4" /> New Question
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]/60 transition-all"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]/60 transition-all">
            <option value="all">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]/60 transition-all">
            <option value="all">All Difficulties</option>
            {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] focus:border-[#FF6B9D]/60 transition-all">
            <option value="all">All Topics</option>
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="text-[12px] text-slate-400 ml-auto">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem_6rem] items-center gap-3 px-4 border-b border-slate-100">
            <div />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Question</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Type</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Difficulty</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Topic</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 text-right">Points</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 text-right">Actions</span>
          </div>

          <div>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem_6rem] items-center gap-3 px-4 py-3 border-b border-slate-50">
                <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/3" />
                </div>
                {[...Array(5)].map((_, j) => <div key={j} className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ))}

            {!loading && filtered.map(q => {
              const typeLabel = QUESTION_TYPES.find(t => t.id === q.type)?.short ?? q.type
              const optCount = q.payload?.options?.length
              return (
                <div
                  key={q.id}
                  className={`grid grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem_6rem] items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${selected.has(q.id) ? 'bg-[#FFF5F7]/60' : ''}`}
                >
                  <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} className="rounded accent-[#E63E6D]" />

                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{q.text}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{typeLabel}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${diffColor[q.difficulty] ?? 'bg-slate-50 text-slate-500'}`}>{q.difficulty}</span>
                      {optCount > 0 && <span className="text-[10px] text-slate-400">{optCount} options</span>}
                    </div>
                  </div>

                  <span className="hidden md:block text-[12px] text-slate-500">{typeLabel}</span>
                  <span className={`hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold w-fit ${diffColor[q.difficulty] ?? 'bg-slate-50 text-slate-500'}`}>{q.difficulty}</span>
                  <span className="hidden md:block text-[12px] text-slate-400">{q.topic}</span>
                  <span className="hidden md:block text-[13px] font-semibold text-slate-800 text-right">{q.points} pts</span>

                  <div className="hidden md:flex items-center justify-end gap-1">
                    <button
                      onClick={() => setModal(flattenRow(q))}
                      title="Edit"
                      className="p-1.5 text-slate-400 hover:text-[#E63E6D] hover:bg-[#FFF5F7] rounded-lg transition-colors"
                    ><Edit2 className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => handleCopy(q)}
                      title="Duplicate"
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    ><Copy className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )
            })}

            {!loading && filtered.length === 0 && (
              <div className="py-16 text-center">
                <Database className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {questions.length === 0 ? 'No questions yet — create your first one!' : 'No questions match your filters'}
                </p>
                {questions.length === 0 && (
                  <button onClick={() => setModal('new')} className="mt-3 text-sm text-[#E63E6D] hover:text-[#C41E5C] font-medium">
                    + New Question
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Single question modal */}
      {modal !== null && (
        <QuestionModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Bulk import modal */}
      {showImport && (
        <QuestionImportModal
          onClose={() => setShowImport(false)}
          onImported={created => {
            setQuestions(prev => [...created, ...prev])
            setShowImport(false)
          }}
        />
      )}
    </div>
  )
}
