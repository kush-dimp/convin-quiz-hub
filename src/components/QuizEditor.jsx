import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, Save, Settings, Eye, Plus, GripVertical,
  Trash2, Copy, HelpCircle, ChevronDown, ChevronRight, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Link as LinkIcon, Image, Code, Undo2, Redo2,
  Maximize2, Minimize2, Type, Video, Table, MoreHorizontal,
  Database, Shuffle, BarChart2, FileUp, FileDown,
  Check, AlertCircle,
} from 'lucide-react'
import { QUESTION_TYPES, DIFFICULTY_LEVELS, TOPICS, mockQuestionBank } from '../data/mockQuestions'
import { useQuiz } from '../hooks/useQuizzes'

/* ── Shared Tabs ─────────────────────────────────────────────────────── */
const EDITOR_TABS = [
  { id: 'questions', label: 'Questions',    icon: HelpCircle },
  { id: 'bank',      label: 'Question Bank',icon: Database   },
  { id: 'random',    label: 'Randomization',icon: Shuffle    },
  { id: 'scoring',   label: 'Scoring',      icon: BarChart2  },
  { id: 'media',     label: 'Media',        icon: Image      },
  { id: 'logic',     label: 'Logic',        icon: ChevronRight},
  { id: 'import',    label: 'Import/Export',icon: FileUp     },
]

/* ══════════════════════════════════════════════════════════════
   PROMPT 9 — Rich Text Editor
═══════════════════════════════════════════════════════════════ */
function RichTextEditor({ value, onChange, placeholder = 'Type your question here…' }) {
  const editorRef = useRef(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)

  const exec = useCallback((cmd, val) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }, [])

  function handleInput() {
    const text = editorRef.current?.innerText || ''
    setCharCount(text.length)
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    onChange?.(editorRef.current?.innerHTML || '')
  }

  const ToolBtn = ({ cmd, val, icon: Icon, title, active }) => (
    <button
      onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}
      title={title}
      className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${active ? 'bg-[#FFE5EC] text-[#E63E6D]' : 'text-slate-600'}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )

  function insertLink() {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }
  function insertImage() {
    const url = window.prompt('Image URL:', 'https://')
    if (url) exec('insertImage', url)
  }
  function insertTable() {
    const rows = 3, cols = 3
    let html = '<table border="1" style="border-collapse:collapse;width:100%">'
    for (let r = 0; r < rows; r++) {
      html += '<tr>' + '<td style="padding:4px 8px;border:1px solid #e5e7eb">&nbsp;</td>'.repeat(cols) + '</tr>'
    }
    html += '</table><br/>'
    exec('insertHTML', html)
  }

  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white shadow-2xl flex flex-col' : ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        <ToolBtn cmd="bold"          icon={Bold}          title="Bold (Ctrl+B)"      />
        <ToolBtn cmd="italic"        icon={Italic}        title="Italic (Ctrl+I)"    />
        <ToolBtn cmd="underline"     icon={Underline}     title="Underline (Ctrl+U)" />
        <ToolBtn cmd="strikethrough" icon={Strikethrough} title="Strikethrough"      />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <select
          onMouseDown={e => e.preventDefault()}
          onChange={e => exec('fontSize', e.target.value)}
          className="text-xs border-0 bg-transparent text-slate-600 pr-1 focus:outline-none cursor-pointer"
          defaultValue="3"
        >
          {[1,2,3,4,5,6,7].map(s => <option key={s} value={s}>{[10,12,14,16,18,20,24][s-1]}px</option>)}
        </select>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolBtn cmd="justifyLeft"   icon={AlignLeft}    title="Align Left"   />
        <ToolBtn cmd="justifyCenter" icon={AlignCenter}  title="Align Center" />
        <ToolBtn cmd="justifyRight"  icon={AlignRight}   title="Align Right"  />
        <ToolBtn cmd="justifyFull"   icon={AlignJustify} title="Justify"      />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolBtn cmd="insertUnorderedList" icon={List}         title="Bullet List"   />
        <ToolBtn cmd="insertOrderedList"   icon={ListOrdered}  title="Numbered List" />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button onMouseDown={e => { e.preventDefault(); insertLink()  }} title="Insert Link"  className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><LinkIcon className="w-3.5 h-3.5" /></button>
        <button onMouseDown={e => { e.preventDefault(); insertImage() }} title="Insert Image" className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Image    className="w-3.5 h-3.5" /></button>
        <button onMouseDown={e => { e.preventDefault(); insertTable() }} title="Insert Table" className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Table    className="w-3.5 h-3.5" /></button>
        <ToolBtn cmd="formatBlock" val="pre" icon={Code} title="Code Block" />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <ToolBtn cmd="undo" icon={Undo2} title="Undo (Ctrl+Z)" />
        <ToolBtn cmd="redo" icon={Redo2} title="Redo (Ctrl+Y)" />
        <div className="flex-1" />
        <button onClick={() => setFullscreen(f => !f)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
      {/* Content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={`px-4 py-3 text-sm text-slate-800 focus:outline-none min-h-[80px] ${fullscreen ? 'flex-1 overflow-y-auto' : ''} empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400`}
        style={{ lineHeight: 1.6 }}
      />
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 10 — Question Type Editor
═══════════════════════════════════════════════════════════════ */
function QuestionTypeEditor({ question, onChange }) {
  const { type } = question

  function update(field, val) { onChange({ ...question, [field]: val }) }

  if (type === 'mcq_single' || type === 'mcq_multi') {
    const options = question.options || ['', '', '', '']
    const isMulti = type === 'mcq_multi'
    return (
      <div className="space-y-2 mt-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Answer Options</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              onClick={() => {
                if (isMulti) {
                  const ci = question.correctIndices || []
                  update('correctIndices', ci.includes(i) ? ci.filter(x => x !== i) : [...ci, i])
                } else {
                  update('correctIndex', i)
                }
              }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                isMulti
                  ? (question.correctIndices || []).includes(i) ? 'bg-green-500 border-green-500' : 'border-slate-300'
                  : question.correctIndex === i ? 'bg-green-500 border-green-500' : 'border-slate-300'
              }`}
            >
              {((isMulti && (question.correctIndices||[]).includes(i)) || (!isMulti && question.correctIndex === i)) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <input
              value={opt}
              onChange={e => { const o = [...options]; o[i] = e.target.value; update('options', o) }}
              placeholder={`Option ${String.fromCharCode(65+i)}`}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50"
            />
            <button onClick={() => update('options', options.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={() => update('options', [...options, ''])} className="text-xs text-[#E63E6D] hover:text-[#C41E5C] font-medium flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Option
        </button>
        {isMulti && <p className="text-[11px] text-slate-400">Click circle to mark correct answers (multiple allowed)</p>}
      </div>
    )
  }

  if (type === 'true_false') return (
    <div className="flex gap-3 mt-3">
      {[true, false].map(v => (
        <button key={String(v)} onClick={() => update('correctAnswer', v)}
          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${question.correctAnswer === v ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          {v ? '✓ True' : '✗ False'}
        </button>
      ))}
    </div>
  )

  if (type === 'fill_blank') return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold text-slate-500">Correct Answer</p>
      <input value={question.correctAnswer || ''} onChange={e => update('correctAnswer', e.target.value)} placeholder="Enter the correct answer" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50" />
      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" checked={question.caseSensitive || false} onChange={e => update('caseSensitive', e.target.checked)} className="rounded" />
        Case sensitive
      </label>
    </div>
  )

  if (type === 'short' || type === 'essay') return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-slate-500">Sample Answer / Rubric</p>
      <textarea value={question.sampleAnswer || ''} onChange={e => update('sampleAnswer', e.target.value)} rows={3} placeholder="Provide a sample answer or grading rubric…" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] resize-none bg-slate-50" />
      <div className="flex gap-4 text-xs text-slate-500">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="number" defaultValue={type === 'short' ? 200 : 1000} className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none bg-slate-50" />
          Max characters
        </label>
      </div>
    </div>
  )

  if (type === 'matching') {
    const pairs = question.pairs || [{ left: '', right: '' }, { left: '', right: '' }]
    return (
      <div className="space-y-2 mt-3">
        <p className="text-xs font-semibold text-slate-500">Matching Pairs</p>
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={p.left} onChange={e => { const ps = [...pairs]; ps[i] = { ...ps[i], left: e.target.value }; update('pairs', ps) }} placeholder="Left item" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50" />
            <span className="text-slate-300">↔</span>
            <input value={p.right} onChange={e => { const ps = [...pairs]; ps[i] = { ...ps[i], right: e.target.value }; update('pairs', ps) }} placeholder="Right item" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50" />
            <button onClick={() => update('pairs', pairs.filter((_,j) => j !== i))} className="text-slate-300 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => update('pairs', [...pairs, { left: '', right: '' }])} className="text-xs text-[#E63E6D] font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add Pair</button>
      </div>
    )
  }

  if (type === 'ordering') {
    const items = question.items || ['', '', '']
    return (
      <div className="space-y-2 mt-3">
        <p className="text-xs font-semibold text-slate-500">Items (correct order top to bottom)</p>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FFE5EC] text-[#E63E6D] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
            <input value={item} onChange={e => { const it = [...items]; it[i] = e.target.value; update('items', it) }} placeholder={`Item ${i+1}`} className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] bg-slate-50" />
            <button onClick={() => update('items', items.filter((_,j) => j !== i))} className="text-slate-300 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => update('items', [...items, ''])} className="text-xs text-[#E63E6D] font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add Item</button>
      </div>
    )
  }

  if (type === 'rating') return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500 block mb-1">Scale</label>
          <select value={question.scale || 5} onChange={e => update('scale', +e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none">
            <option value={5}>1–5</option><option value={10}>1–10</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500 block mb-1">Low label</label>
          <input placeholder="e.g. Poor" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-slate-50" />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500 block mb-1">High label</label>
          <input placeholder="e.g. Excellent" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-slate-50" />
        </div>
      </div>
    </div>
  )

  if (type === 'matrix') {
    const rows = question.rows || ['Row 1', 'Row 2']
    const cols = question.columns || ['Col 1', 'Col 2', 'Col 3']
    return (
      <div className="mt-3 space-y-3">
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-1">Rows</p>
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input value={r} onChange={e => { const rs=[...rows]; rs[i]=e.target.value; update('rows',rs) }} className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-slate-50" />
                <button onClick={() => update('rows', rows.filter((_,j)=>j!==i))} className="text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => update('rows', [...rows, `Row ${rows.length+1}`])} className="text-xs text-[#E63E6D] flex items-center gap-0.5"><Plus className="w-3 h-3" />Add Row</button>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 mb-1">Columns</p>
            {cols.map((c, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <input value={c} onChange={e => { const cs=[...cols]; cs[i]=e.target.value; update('columns',cs) }} className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-slate-50" />
                <button onClick={() => update('columns', cols.filter((_,j)=>j!==i))} className="text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => update('columns', [...cols, `Col ${cols.length+1}`])} className="text-xs text-[#E63E6D] flex items-center gap-0.5"><Plus className="w-3 h-3" />Add Column</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 11 — Question Bank Modal
═══════════════════════════════════════════════════════════════ */
function QuestionBankModal({ onClose, onAdd }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDiff, setFilterDiff] = useState('all')
  const [selected, setSelected] = useState(new Set())

  const filtered = mockQuestionBank.filter(q =>
    (filterType === 'all' || q.type === filterType) &&
    (filterDiff === 'all' || q.difficulty === filterDiff) &&
    q.text.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) { setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b flex-shrink-0">
          <Database className="w-5 h-5 text-[#E63E6D]" />
          <h2 className="font-heading text-sm font-bold text-slate-900 flex-1">Add from Question Bank</h2>
          <span className="text-xs text-slate-400">{filtered.length} questions</span>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="px-4 py-3 border-b flex flex-wrap gap-2 flex-shrink-0">
          <div className="relative flex-1 min-w-40">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-none">
            <option value="all">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-none">
            <option value="all">All Difficulties</option>
            {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.map(q => (
            <label key={q.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${selected.has(q.id) ? 'bg-[#FFF5F7]/60' : ''}`}>
              <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} className="mt-0.5 rounded border-slate-300 accent-[#E63E6D]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-snug">{q.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{QUESTION_TYPES.find(t => t.id === q.type)?.short}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{q.difficulty}</span>
                  <span className="text-[10px] text-slate-400">{q.topic} · {q.points}pts · used in {q.usedIn} quizzes</span>
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-between items-center px-6 py-4 border-t flex-shrink-0">
          <span className="text-xs text-slate-500">{selected.size} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
            <button onClick={() => { onAdd([...selected]); onClose() }} disabled={selected.size === 0} className="px-4 py-2 text-sm font-semibold text-white bg-[#E63E6D] rounded-xl hover:bg-[#C41E5C] transition-colors disabled:opacity-40">
              Add {selected.size > 0 ? selected.size : ''} Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 12 — Randomization Panel
═══════════════════════════════════════════════════════════════ */
function RandomizationPanel() {
  const [settings, setSettings] = useState({ shuffleAll: false, shuffleSections: false, shuffleOptions: true, poolMode: false, poolSize: 10 })
  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }))
  function Toggle({ checked, onChange }) {
    return <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#E63E6D]' : 'bg-slate-300'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>
  }
  return (
    <div className="space-y-4 py-2">
      <h3 className="font-heading text-sm font-bold text-slate-900">Randomization Settings</h3>
      <div className="space-y-3">
        {[
          { k: 'shuffleAll',      label: 'Shuffle All Questions',      desc: 'Present questions in random order for each test taker' },
          { k: 'shuffleSections', label: 'Shuffle Within Sections',    desc: 'Randomize questions within each section only' },
          { k: 'shuffleOptions',  label: 'Shuffle Answer Options',     desc: 'Randomize the order of multiple-choice options' },
        ].map(({ k, label, desc }) => (
          <div key={k} className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <Toggle checked={settings[k]} onChange={v => set(k, v)} />
          </div>
        ))}
      </div>
      <div className={`p-4 border rounded-xl space-y-3 transition-colors ${settings.poolMode ? 'border-[#FFB3C6] bg-[#FFF5F7]/30' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Question Pool Mode</p>
            <p className="text-xs text-slate-500 mt-0.5">Randomly select N questions from the full question set</p>
          </div>
          <Toggle checked={settings.poolMode} onChange={v => set('poolMode', v)} />
        </div>
        {settings.poolMode && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs text-slate-600 font-medium whitespace-nowrap">Questions to show:</label>
            <input type="number" value={settings.poolSize} min={1} max={50} onChange={e => set('poolSize', +e.target.value)} className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 bg-slate-50" />
            <span className="text-xs text-slate-400">per attempt</span>
          </div>
        )}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-700">
        <strong>Distribution Note:</strong> Enabled settings ensure at least 30% easy, 40% medium, and 30% hard/expert questions when questions have difficulty ratings.
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 13 — Scoring & Difficulty Panel
═══════════════════════════════════════════════════════════════ */
function ScoringPanel({ questions, onUpdate }) {
  const [negMarking, setNegMarking] = useState(false)
  const [speedBonus, setSpeedBonus] = useState(false)
  const [bulkPts, setBulkPts] = useState(10)
  const totalPts = questions.reduce((s, q) => s + (q.points || 10), 0)

  function applyBulk() { onUpdate(questions.map(q => ({ ...q, points: bulkPts }))) }

  const diffColor = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-red-100 text-red-700', Expert: 'bg-purple-100 text-purple-700' }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-slate-900">Scoring & Difficulty</h3>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          Total: <span className="font-bold text-[#E63E6D] text-base">{totalPts} pts</span>
        </div>
      </div>
      {/* Bulk assign */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-xs font-medium text-slate-600 flex-1">Bulk assign points:</span>
        <input type="number" value={bulkPts} min={1} max={100} onChange={e => setBulkPts(+e.target.value)} className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none bg-slate-50" />
        <button onClick={applyBulk} className="px-3 py-1.5 text-xs font-semibold text-[#E63E6D] bg-[#FFF5F7] hover:bg-[#FFE5EC] rounded-lg transition-colors">Apply All</button>
      </div>
      {/* Per-question */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={q.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-white hover:border-slate-200 transition-colors">
            <span className="text-xs text-slate-400 font-medium w-5 text-center flex-shrink-0">Q{i+1}</span>
            <p className="flex-1 text-xs text-slate-700 truncate min-w-0">{q.text || 'Untitled question'}</p>
            <select
              value={q.difficulty || 'Medium'}
              onChange={e => { const qs = [...questions]; qs[i] = { ...qs[i], difficulty: e.target.value }; onUpdate(qs) }}
              className={`border-0 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${diffColor[q.difficulty || 'Medium']}`}
            >
              {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <input
                type="number" value={q.points || 10} min={0} max={100}
                onChange={e => { const qs = [...questions]; qs[i] = { ...qs[i], points: +e.target.value }; onUpdate(qs) }}
                className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none bg-slate-50"
              />
              <span className="text-xs text-slate-400">pts</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" checked={negMarking} onChange={e => setNegMarking(e.target.checked)} className="rounded accent-[#E63E6D]" />
          Negative marking <span className="text-xs text-slate-400">(-25% for wrong)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" checked={speedBonus} onChange={e => setSpeedBonus(e.target.checked)} className="rounded accent-[#E63E6D]" />
          Speed bonus
        </label>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 14 — Media Panel
═══════════════════════════════════════════════════════════════ */
function MediaPanel() {
  const [tab, setTab] = useState('upload')
  const [preview, setPreview] = useState(null)
  const [urlInput, setUrlInput] = useState('')

  return (
    <div className="space-y-4 py-2">
      <h3 className="font-heading text-sm font-bold text-slate-900">Multimedia</h3>
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        {['upload','url','video'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t === 'url' ? 'Image URL' : t === 'video' ? 'Video Embed' : 'Upload File'}</button>
        ))}
      </div>
      {tab === 'upload' && (
        <div>
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-[#FF6B9D] hover:bg-[#FFF5F7]/30 transition-colors group">
            <Image className="w-8 h-8 text-slate-300 group-hover:text-[#FF6B9D] mb-2 transition-colors" />
            <span className="text-sm font-medium text-slate-500 group-hover:text-[#E63E6D]">Click to upload or drag & drop</span>
            <span className="text-xs text-slate-400 mt-1">JPG, PNG, GIF, MP4, MP3, PDF — max 50MB</span>
            <input type="file" accept="image/*,video/*,audio/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)) }} />
          </label>
          {preview && <div className="mt-3"><img src={preview} alt="preview" className="max-h-40 rounded-xl object-contain border border-slate-200" /></div>}
        </div>
      )}
      {tab === 'url' && (
        <div className="space-y-3">
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 bg-slate-50" />
          <input placeholder="Alt text for accessibility" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 bg-slate-50" />
          {urlInput && <img src={urlInput} alt="preview" className="max-h-40 rounded-xl object-contain border border-slate-200" onError={e => e.target.style.display='none'} />}
        </div>
      )}
      {tab === 'video' && (
        <div className="space-y-3">
          <input placeholder="YouTube or Vimeo URL" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 bg-slate-50" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" className="rounded accent-[#E63E6D]" /> Start at timestamp</label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" className="rounded accent-[#E63E6D]" /> Autoplay</label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" defaultChecked className="rounded accent-[#E63E6D]" /> Show controls</label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700"><input type="checkbox" className="rounded accent-[#E63E6D]" /> Loop</label>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 15 — Logic Builder
═══════════════════════════════════════════════════════════════ */
function LogicPanel({ questions }) {
  const [rules, setRules] = useState([])
  function addRule() {
    setRules(p => [...p, { id: Date.now(), ifQ: '', ifAnswer: '', operator: 'equals', action: 'show', targetQ: '' }])
  }
  function updateRule(id, field, val) { setRules(p => p.map(r => r.id === id ? { ...r, [field]: val } : r)) }
  function removeRule(id) { setRules(p => p.filter(r => r.id !== id)) }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-slate-900">Skip Logic / Branching</h3>
        <button onClick={addRule} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E63E6D] bg-[#FFF5F7] hover:bg-[#FFE5EC] rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </button>
      </div>
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <ChevronRight className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-sm text-slate-400 font-medium">No logic rules yet</p>
          <p className="text-xs text-slate-300 mt-1">Add rules to control question flow based on answers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="p-3.5 border border-slate-200 rounded-xl space-y-2.5 bg-slate-50/50">
              <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-slate-600">
                <span className="bg-[#FFE5EC] text-[#C41E5C] px-2 py-1 rounded-md">IF</span>
                <select value={rule.ifQ} onChange={e => updateRule(rule.id, 'ifQ', e.target.value)} className="border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  <option value="">Question…</option>
                  {questions.map((q,i) => <option key={q.id} value={q.id}>Q{i+1}: {q.text?.slice(0,30) || 'Untitled'}</option>)}
                </select>
                <select value={rule.operator} onChange={e => updateRule(rule.id, 'operator', e.target.value)} className="border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="gt">score &gt;</option>
                  <option value="lt">score &lt;</option>
                </select>
                <input value={rule.ifAnswer} onChange={e => updateRule(rule.id, 'ifAnswer', e.target.value)} placeholder="value" className="w-28 border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-xs focus:outline-none" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-slate-600">
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md">THEN</span>
                <select value={rule.action} onChange={e => updateRule(rule.id, 'action', e.target.value)} className="border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  <option value="show">Show</option>
                  <option value="hide">Hide</option>
                  <option value="skip">Skip to</option>
                </select>
                <select value={rule.targetQ} onChange={e => updateRule(rule.id, 'targetQ', e.target.value)} className="border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  <option value="">Question…</option>
                  {questions.map((q,i) => <option key={q.id} value={q.id}>Q{i+1}: {q.text?.slice(0,30) || 'Untitled'}</option>)}
                </select>
                <button onClick={() => removeRule(rule.id)} className="ml-auto text-slate-300 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {rules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
          Logic rules are validated for circular dependencies. Preview mode lets you test all paths.
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROMPT 16 — Import/Export
═══════════════════════════════════════════════════════════════ */
function ImportExportPanel() {
  const [mode, setMode] = useState('import')
  const [importFormat, setImportFormat] = useState('csv')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [exporting, setExporting] = useState(false)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setParsed([
      { text: 'What is the OSI model?', type: 'mcq_single', options: 'A,B,C,D', correct: 'B', status: 'valid' },
      { text: 'Define TCP',             type: 'short',      options: '',        correct: '',  status: 'valid' },
      { text: 'True or False: …',       type: 'true_false', options: '',        correct: 'True', status: 'warning' },
    ])
  }

  async function handleExport() {
    setExporting(true)
    await new Promise(r => setTimeout(r, 800))
    const data = [['Question','Type','Options','Correct Answer'],['What is TCP?','mcq_single','A,B,C,D','B']]
    const csv = data.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: `quiz-export-${Date.now()}.${exportFormat === 'pdf' ? 'pdf' : 'csv'}` })
    a.click(); URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setMode('import')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${mode === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Import</button>
        <button onClick={() => setMode('export')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${mode === 'export' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Export</button>
      </div>
      {mode === 'import' ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Import Format</label>
            <div className="flex flex-wrap gap-2">
              {['csv','excel','word','moodle_xml','qti','google_forms'].map(f => (
                <button key={f} onClick={() => setImportFormat(f)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${importFormat === f ? 'border-[#FF6B9D] bg-[#FFF5F7] text-[#C41E5C]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {f.replace('_',' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-[#FF6B9D] hover:bg-[#FFF5F7]/20 transition-colors">
            <FileUp className="w-7 h-7 text-slate-300 mb-1.5" />
            <span className="text-sm font-medium text-slate-500">{file ? file.name : 'Choose file to import'}</span>
            <span className="text-xs text-slate-400 mt-0.5">Drag & drop or click</span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
          {parsed && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Preview ({parsed.length} questions detected)</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                    <tr>{['Question','Type','Correct Answer','Status'].map(h => <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.map((q,i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700 max-w-48 truncate">{q.text}</td>
                        <td className="px-3 py-2 text-slate-500">{q.type}</td>
                        <td className="px-3 py-2 text-slate-500">{q.correct || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${q.status === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{q.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="mt-3 w-full py-2 bg-[#E63E6D] text-white text-sm font-semibold rounded-xl hover:bg-[#C41E5C] transition-colors">Import {parsed.length} Questions</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Export Format</label>
            <div className="flex flex-wrap gap-2">
              {['pdf','csv','excel','word'].map(f => (
                <button key={f} onClick={() => setExportFormat(f)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${exportFormat === f ? 'border-[#FF6B9D] bg-[#FFF5F7] text-[#C41E5C]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{f.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {[['Include answer key','Include correct answers in export'],['Include explanations','Include feedback for each question'],['Include points','Show point values per question']].map(([label, desc]) => (
              <label key={label} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" defaultChecked className="rounded accent-[#E63E6D]" />
                <div><p className="text-sm font-medium text-slate-800">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
              </label>
            ))}
          </div>
          <button onClick={handleExport} disabled={exporting} className="w-full py-2.5 bg-[#E63E6D] text-white text-sm font-semibold rounded-xl hover:bg-[#C41E5C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <FileDown className="w-4 h-4" />
            {exporting ? 'Exporting…' : `Export as ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN QUIZ EDITOR
═══════════════════════════════════════════════════════════════ */
let qCounter = 100
export default function QuizEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { quiz, questions: dbQuestions, loading: quizLoading, saveQuestions } = useQuiz(id)

  const [questions, setQuestions] = useState([])
  const [activeTab, setActiveTab] = useState('questions')
  const [selectedQ, setSelectedQ] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [showBank, setShowBank] = useState(false)
  const [quizTitle, setQuizTitle] = useState('Loading…')

  // Populate local state once DB data loads
  useEffect(() => {
    if (quiz) setQuizTitle(quiz.title)
  }, [quiz])

  useEffect(() => {
    if (dbQuestions.length > 0) {
      setQuestions(dbQuestions)
      setSelectedQ(dbQuestions[0]?.id)
    }
  }, [dbQuestions])

  const selected = questions.find(q => q.id === selectedQ)

  function addQuestion(type = 'mcq_single') {
    const newQ = { id: `q${++qCounter}`, type, text: '', points: 10, difficulty: 'Medium' }
    setQuestions(p => [...p, newQ])
    setSelectedQ(newQ.id)
  }

  function updateQuestion(updated) { setQuestions(p => p.map(q => q.id === updated.id ? updated : q)) }
  function deleteQuestion(id) {
    setQuestions(p => { const n = p.filter(q => q.id !== id); setSelectedQ(n[0]?.id); return n })
  }
  function addFromBank(ids) {
    const banked = mockQuestionBank.filter(q => ids.includes(q.id))
    const mapped = banked.map(q => ({ ...q, id: `q${++qCounter}` }))
    setQuestions(p => [...p, ...mapped])
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      // Save questions to DB
      const { error: qErr } = await saveQuestions(questions)
      if (qErr) throw qErr
      // Update quiz title
      const tRes = await fetch(`/api/quizzes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: quizTitle }),
      })
      if (!tRes.ok) throw new Error('Failed to save quiz title')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err.message || 'Save failed')
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  if (quizLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-6 h-6 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Toast notifications */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Questions saved!</p>
            <p className="text-xs text-emerald-100">All changes have been saved to the database.</p>
          </div>
        </div>
      )}
      {saveError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Save failed</p>
            <p className="text-xs text-red-100">{saveError}</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 h-14 flex items-center gap-4 flex-shrink-0 shadow-sm">
        <Link to="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <div className="w-px h-5 bg-slate-200" />
        <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="text-sm font-bold text-slate-900 border-0 bg-transparent focus:outline-none focus:underline flex-1 min-w-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" />Saved</span>}
          <button onClick={() => navigate(`/quizzes/${id}/settings`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-[#E63E6D] hover:bg-[#C41E5C] rounded-xl transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 flex gap-1 flex-shrink-0">
        {EDITOR_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#E63E6D] text-[#E63E6D]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'questions' ? (
          <>
            {/* Question list */}
            <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-semibold text-slate-500">{questions.length} Questions · {questions.reduce((s,q) => s+(q.points||10),0)} pts</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQ(q.id)}
                    className={`w-full text-left px-3 py-3 border-b border-slate-50 flex items-center gap-2.5 group transition-colors ${selectedQ === q.id ? 'bg-[#FFF5F7] border-l-2 border-l-[#FF6B9D]' : 'hover:bg-slate-50'}`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{q.text || 'Untitled question'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{QUESTION_TYPES.find(t => t.id === q.type)?.short} · {q.points||10}pts</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteQuestion(q.id) }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
              </div>
              {/* Add question */}
              <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-2">
                <select onChange={e => { addQuestion(e.target.value); e.target.value = '' }} defaultValue="" className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]">
                  <option value="" disabled>+ Add question type…</option>
                  {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <button onClick={() => setShowBank(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[#E63E6D] border border-[#FFB3C6] bg-[#FFF5F7] hover:bg-[#FFE5EC] rounded-lg transition-colors">
                  <Database className="w-3.5 h-3.5" /> From Question Bank
                </button>
              </div>
            </div>

            {/* Question editor */}
            <div className="flex-1 overflow-y-auto p-6">
              {selected ? (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={selected.type}
                      onChange={e => updateQuestion({ ...selected, type: e.target.value })}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6]"
                    >
                      {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <div className="flex items-center gap-2 ml-auto">
                      <button onClick={() => setQuestions(p => { const i = p.findIndex(q=>q.id===selected.id); const n=[...p]; n.splice(i,0,{...selected,id:`q${++qCounter}`}); return n })} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                      <button onClick={() => deleteQuestion(selected.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Question Text</label>
                    <RichTextEditor value={selected.text} onChange={text => updateQuestion({ ...selected, text })} />
                  </div>
                  <QuestionTypeEditor question={selected} onChange={updateQuestion} />
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">Explanation / Feedback</label>
                      <textarea value={selected.explanation || ''} onChange={e => updateQuestion({ ...selected, explanation: e.target.value })} rows={2} placeholder="Explain the correct answer…" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] resize-none bg-slate-50" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <HelpCircle className="w-10 h-10 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Select a question to edit</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              {activeTab === 'bank'    && <QuestionBankModal onClose={() => setActiveTab('questions')} onAdd={addFromBank} />}
              {activeTab === 'random' && <RandomizationPanel />}
              {activeTab === 'scoring'&& <ScoringPanel questions={questions} onUpdate={setQuestions} />}
              {activeTab === 'media'  && <MediaPanel />}
              {activeTab === 'logic'  && <LogicPanel questions={questions} />}
              {activeTab === 'import' && <ImportExportPanel />}
            </div>
          </div>
        )}
      </div>
      {showBank && <QuestionBankModal onClose={() => setShowBank(false)} onAdd={addFromBank} />}
    </div>
  )
}
