import { useState, useEffect } from 'react'
import { Database, Search, Plus, Filter, Edit2, Trash2, Copy, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { QUESTION_TYPES, DIFFICULTY_LEVELS, TOPICS } from '../data/mockQuestions'

const diffColor = {
  Easy:   'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  Hard:   'bg-red-50 text-red-600',
  Expert: 'bg-violet-50 text-violet-700',
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDiff, setFilterDiff] = useState('all')
  const [filterTopic, setFilterTopic] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .is('quiz_id', null)
        .order('created_at', { ascending: false })
      if (!error) setQuestions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = questions.filter(q =>
    (filterType === 'all' || q.type === filterType) &&
    (filterDiff === 'all' || q.difficulty === filterDiff) &&
    (filterTopic === 'all' || q.topic === filterTopic) &&
    (q.text ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) { setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  async function addQuestion() {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        quiz_id: null,
        type: 'mcq_single',
        text: 'New Question',
        difficulty: 'Medium',
        topic: 'General',
        points: 10,
      })
      .select()
      .single()
    if (!error && data) setQuestions(prev => [data, ...prev])
  }

  function startEdit(q) { setEditingId(q.id); setEditText(q.text) }

  async function saveEdit(id) {
    const { error } = await supabase.from('questions').update({ text: editText }).eq('id', id)
    if (!error) setQuestions(prev => prev.map(q => q.id === id ? { ...q, text: editText } : q))
    setEditingId(null)
  }

  async function deleteQuestion(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) {
      setQuestions(prev => prev.filter(q => q.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  function exportSelected() {
    const qs = filtered.filter(q => selected.has(q.id))
    const csv = [['ID','Question','Type','Difficulty','Topic','Points']].concat(qs.map(q => [q.id,`"${q.text}"`,q.type,q.difficulty,q.topic,q.points]))
    const blob = new Blob([csv.map(r=>r.join(',')).join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'question-bank.csv' })
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-indigo-600" />
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
              onClick={addQuestion}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm shadow-indigo-200 transition-all"
            >
              <Plus className="w-4 h-4" /> New Question
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
          >
            <option value="all">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select
            value={filterDiff}
            onChange={e => setFilterDiff(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
          >
            <option value="all">All Difficulties</option>
            {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select
            value={filterTopic}
            onChange={e => setFilterTopic(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-[13px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
          >
            <option value="all">All Topics</option>
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="text-[12px] text-slate-400 ml-auto">{filtered.length} results</span>
        </div>

        {/* Question list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem_4rem_6rem] items-center gap-3 px-4 border-b border-slate-100">
            <div />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Question</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Type</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Difficulty</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5">Topic</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 text-right">Points</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 text-right" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3.5 text-right">Actions</span>
          </div>
          <div>
            {loading && (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem_4rem_6rem] items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/3" />
                  </div>
                  <div className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />
                  <div className="hidden md:block h-3 bg-slate-100 rounded animate-pulse" />
                </div>
              ))
            )}
            {!loading && filtered.map(q => (
              <div
                key={q.id}
                className={`grid grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem_4rem_6rem] items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${selected.has(q.id) ? 'bg-indigo-50/60' : ''}`}
              >
                <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} className="rounded accent-indigo-600" />
                <div className="min-w-0">
                  {editingId === q.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(q.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="flex-1 bg-white border border-indigo-300 rounded-lg text-[13px] px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      <button onClick={() => saveEdit(q.id)} className="text-[11px] font-semibold text-white bg-indigo-600 rounded-lg px-2 py-1 hover:bg-indigo-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[11px] text-slate-500 hover:text-slate-700">✕</button>
                    </div>
                  ) : (
                    <p className="text-[13px] font-semibold text-slate-800 truncate md:max-w-xs">{q.text}</p>
                  )}
                  <div className="flex gap-2 mt-0.5 md:hidden">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{QUESTION_TYPES.find(t=>t.id===q.type)?.short}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${diffColor[q.difficulty] ?? 'bg-slate-50 text-slate-500'}`}>{q.difficulty}</span>
                  </div>
                </div>
                <span className="hidden md:block text-[12px] text-slate-400">{QUESTION_TYPES.find(t=>t.id===q.type)?.short ?? q.type}</span>
                <span className={`hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold w-fit ${diffColor[q.difficulty] ?? 'bg-slate-50 text-slate-500'}`}>{q.difficulty}</span>
                <span className="hidden md:block text-[12px] text-slate-400">{q.topic}</span>
                <span className="hidden md:block text-[13px] font-semibold text-slate-800 text-right">{q.points} pts</span>
                <span className="hidden md:block text-[12px] text-slate-400 text-right" />
                <div className="hidden md:flex items-center justify-end gap-1">
                  <button onClick={() => startEdit(q)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  ><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="py-16 text-center">
                <Database className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No questions match your filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
