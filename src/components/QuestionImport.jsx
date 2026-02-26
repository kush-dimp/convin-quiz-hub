/**
 * QuestionImport — bulk upload with auto-format detection.
 *
 * Accepts: CSV (any column order), TSV/Excel paste, JSON array, plain text
 * Converts everything to the internal question format automatically.
 */
import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, FileText, AlertTriangle, CheckCircle2,
  Trash2, RefreshCw, ChevronDown, Info,
} from 'lucide-react'
import { DIFFICULTY_LEVELS, TOPICS } from '../data/mockQuestions'

/* ═══════════════════════════════════════════════════════
   PARSER
═══════════════════════════════════════════════════════ */

/** Split a single CSV line respecting quoted fields */
function splitCSV(line, delim = ',') {
  const result = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === delim && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}

/** Normalise a header string to a canonical key */
function normHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Map various header spellings → canonical field name */
const HEADER_MAP = {
  // question text
  question: 'text', questiontext: 'text', text: 'text', stem: 'text',
  q: 'text', prompt: 'text',
  // options
  optiona: 'optA', choicea: 'optA', answera: 'optA', a: 'optA', option1: 'optA', choice1: 'optA',
  optionb: 'optB', choiceb: 'optB', answerb: 'optB', b: 'optB', option2: 'optB', choice2: 'optB',
  optionc: 'optC', choicec: 'optC', answerc: 'optC', c: 'optC', option3: 'optC', choice3: 'optC',
  optiond: 'optD', choiced: 'optD', answerd: 'optD', d: 'optD', option4: 'optD', choice4: 'optD',
  optione: 'optE', choicee: 'optE', e: 'optE', option5: 'optE',
  // correct answer
  correct: 'correct', answer: 'correct', correctanswer: 'correct', key: 'correct',
  correctoption: 'correct', rightanswer: 'correct',
  // type
  type: 'type', questiontype: 'type', kind: 'type',
  // metadata
  difficulty: 'difficulty', level: 'difficulty', difficultyLevel: 'difficulty',
  points: 'points', marks: 'points', score: 'points', weightage: 'points',
  topic: 'topic', subject: 'topic', category: 'topic',
  explanation: 'explanation', rationale: 'explanation', solution: 'explanation',
}

function mapHeader(h) { return HEADER_MAP[normHeader(h)] ?? null }

/** Detect question type from a string like "mcq", "true/false", "fill", etc. */
function parseType(raw) {
  if (!raw) return null
  const v = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (['mcq', 'mcqsingle', 'singlechoice', 'multiplechoice', 'mc', 'single'].includes(v)) return 'mcq_single'
  if (['mcqmulti', 'multi', 'multianswer', 'multiplechoicemulti', 'multiselect', 'checkbox', 'checkboxes'].includes(v)) return 'mcq_multi'
  if (['tf', 'truefalse', 'trueorfalse', 'boolean'].includes(v)) return 'true_false'
  if (['fill', 'fillblank', 'fillintheblank', 'blank', 'shortfill'].includes(v)) return 'fill_blank'
  if (['short', 'shortanswer', 'shorttext'].includes(v)) return 'short'
  if (['essay', 'long', 'longanswer', 'openended', 'descriptive', 'paragraph'].includes(v)) return 'essay'
  if (['rating', 'scale', 'likert', 'nps'].includes(v)) return 'rating'
  if (['matching', 'match', 'matchthefollowing', 'matchingpairs'].includes(v)) return 'matching'
  if (['ordering', 'order', 'sequence', 'arrange', 'sortorder'].includes(v)) return 'ordering'
  if (['matrix', 'grid', 'matrixrating', 'matrixgrid'].includes(v)) return 'matrix'
  return null
}

/** Convert a correct-answer token (A/B/1/2/text) to a 0-based index given options */
function resolveCorrectIndex(token, options) {
  if (!token) return 0
  const t = String(token).trim()
  // letter: A/B/C/D/E
  if (/^[a-eA-E]$/.test(t)) return t.toUpperCase().charCodeAt(0) - 65
  // 1-based number
  if (/^\d+$/.test(t)) { const n = parseInt(t); return n > 0 ? n - 1 : 0 }
  // match option text
  const low = t.toLowerCase()
  const idx = (options ?? []).findIndex(o => o.toLowerCase() === low)
  return idx >= 0 ? idx : 0
}

/** Guess type from question text */
function guessType(text, options) {
  const low = text.toLowerCase()
  if (/\btrue or false\b|\btrue\/false\b/.test(low)) return 'true_false'
  if (/___/.test(text) || /fill in/.test(low)) return 'fill_blank'
  if (options && options.filter(Boolean).length > 0) return 'mcq_single'
  return 'short'
}

/** Build a parsed question object from a flat field map */
function buildQuestion(fields) {
  const text = (fields.text ?? '').trim()
  if (!text) return null

  const rawOpts = [fields.optA, fields.optB, fields.optC, fields.optD, fields.optE].filter(Boolean)
  const options = rawOpts.map(o => String(o).trim()).filter(Boolean)

  let type = parseType(fields.type)
  if (!type) type = guessType(text, options)

  let payload = {}
  if (type === 'mcq_single' || type === 'mcq_multi') {
    const idx = resolveCorrectIndex(fields.correct, options)
    payload = type === 'mcq_single'
      ? { options, correctIndex: idx }
      : { options, correctIndices: [idx] }
  } else if (type === 'true_false') {
    const raw = String(fields.correct ?? '').toLowerCase()
    payload = { correctAnswer: ['true', 't', 'yes', '1'].includes(raw) }
  } else if (type === 'fill_blank') {
    payload = { correctAnswer: String(fields.correct ?? ''), caseSensitive: false }
  } else if (type === 'rating') {
    payload = { scale: 5 }
  }
  // matching / ordering / matrix: payload stays {} — complex types need manual setup

  const difficulty = DIFFICULTY_LEVELS.includes(fields.difficulty)
    ? fields.difficulty
    : (['easy', 'e'].includes(String(fields.difficulty ?? '').toLowerCase()) ? 'Easy'
      : ['hard', 'h'].includes(String(fields.difficulty ?? '').toLowerCase()) ? 'Hard'
      : ['expert', 'x'].includes(String(fields.difficulty ?? '').toLowerCase()) ? 'Expert'
      : 'Medium')

  const topic = TOPICS.includes(fields.topic) ? fields.topic : 'General'
  const points = parseInt(fields.points) || 10

  // Complex types that can't be fully auto-parsed are flagged for review
  const _status = ['matching', 'ordering', 'matrix'].includes(type) ? 'review' : 'ok'

  return {
    text, type, difficulty, topic, points,
    explanation: String(fields.explanation ?? '').trim(),
    payload,
    _status,
  }
}

/* ── Structured CSV/TSV parser ── */
function parseStructured(lines, delim) {
  const headers = splitCSV(lines[0], delim)
  const colMap = {}
  headers.forEach((h, i) => { const k = mapHeader(h); if (k) colMap[k] = i })

  if (!('text' in colMap)) return null // no recognisable question column

  return lines.slice(1).map(line => {
    if (!line.trim()) return null
    const cells = splitCSV(line, delim)
    const fields = {}
    Object.entries(colMap).forEach(([key, idx]) => { fields[key] = cells[idx] ?? '' })
    return buildQuestion(fields)
  }).filter(Boolean)
}

/* ── Detect if first line looks like headers ── */
function looksLikeHeader(line, delim) {
  const cells = splitCSV(line, delim)
  // If at least 2 cells map to known headers, treat as header row
  return cells.filter(c => mapHeader(c) !== null).length >= 2
}

/* ── Unstructured CSV: guess column order ─────────────────
   Heuristic: longest cell is probably the question text.
   Options are usually short. Last or 2nd-last cell with
   A/B/C/D/1/2/3/4 content is the correct answer.
────────────────────────────────────────────────────────── */
function parseUnstructuredCSV(lines, delim) {
  return lines.map(line => {
    if (!line.trim()) return null
    const cells = splitCSV(line, delim).map(c => c.trim()).filter(Boolean)
    if (cells.length < 2) return null

    // Longest cell = question text
    const textIdx = cells.reduce((best, c, i) => c.length > cells[best].length ? i : best, 0)
    const text = cells[textIdx]
    const rest = cells.filter((_, i) => i !== textIdx)

    // Detect correct answer token: single letter or number at the end
    let correct = null
    let optCells = rest
    const last = rest[rest.length - 1]
    if (/^[a-eA-E1-5]$/.test(last)) { correct = last; optCells = rest.slice(0, -1) }

    const options = optCells.slice(0, 5)
    const type = guessType(text, options)
    const fields = { text, correct: correct ?? '', type: options.length >= 2 ? 'mcq_single' : type }
    fields.optA = options[0]; fields.optB = options[1]; fields.optC = options[2]
    fields.optD = options[3]; fields.optE = options[4]
    return buildQuestion(fields)
  }).filter(Boolean)
}

/* ── JSON parser ── */
function parseJSON(input) {
  const arr = JSON.parse(input.trim())
  if (!Array.isArray(arr)) throw new Error('Expected JSON array')
  return arr.map(obj => {
    // Try to find fields using various key names
    const text = obj.question ?? obj.text ?? obj.q ?? obj.stem ?? obj.prompt ?? ''
    const rawOpts = (
      obj.options ?? obj.choices ?? obj.answers ??
      [obj.option_a ?? obj.a, obj.option_b ?? obj.b, obj.option_c ?? obj.c,
       obj.option_d ?? obj.d, obj.option_e ?? obj.e]
    ).filter(Boolean)
    const options = rawOpts.map(o => String(o).trim())
    const correct = String(obj.correct ?? obj.answer ?? obj.key ?? obj.correctIndex ?? obj.answer_index ?? '')
    const fields = {
      text, correct, type: obj.type ?? obj.question_type ?? '',
      difficulty: obj.difficulty ?? obj.level ?? '',
      topic: obj.topic ?? obj.subject ?? obj.category ?? '',
      points: obj.points ?? obj.marks ?? obj.score ?? '',
      explanation: obj.explanation ?? obj.rationale ?? '',
      optA: options[0], optB: options[1], optC: options[2], optD: options[3], optE: options[4],
    }
    return buildQuestion(fields)
  }).filter(Boolean)
}

/* ── Plain text parser ──────────────────────────────────
   Handles:
     1. Question text          or   Q1: Question text
     A) Option A               or   a. Option A
     B) Option B *                  (asterisk = correct)
     Answer: B                 or   Correct: B
──────────────────────────────────────────────────────── */
function parsePlainText(input) {
  // Many files have no blank lines between questions, so insert a blank line
  // before each numbered question marker (Q1. Q2: 1. 2) etc.) so they split
  // into separate blocks correctly.
  const normalized = input.replace(
    /\n([ \t]*(?:q(?:uestion)?\s*\d+[\s:.)]|\d+[.)]\s+))/gi,
    '\n\n$1'
  )
  const blocks = normalized.split(/\n\s*\n/).filter(b => b.trim())
  const results = []

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) continue

    let text = ''
    const options = []
    let correctToken = null
    let typeHint = null

    for (const line of lines) {
      // Numbered question start: "1.", "Q1:", "Question 1:"
      const qMatch = line.match(/^(?:q(?:uestion)?\s*\d+\s*[:.)\s]|^\d+[.)]\s*)(.+)/i)
      if (qMatch && !text) { text = qMatch[1].trim(); continue }

      // Option line: "A) ...", "a. ...", "A. ...", "- A) ..."
      const optMatch = line.match(/^[-*•]?\s*([a-eA-E])[.)]\s*(.+)/)
      if (optMatch) {
        const letter = optMatch[1].toUpperCase()
        let optText = optMatch[2].trim()
        let isCorrect = false
        if (optText.endsWith('*') || optText.startsWith('*')) {
          isCorrect = true
          optText = optText.replace(/^\*|\*$/g, '').trim()
        }
        const idx = letter.charCodeAt(0) - 65
        options[idx] = optText
        if (isCorrect) correctToken = letter
        continue
      }

      // Answer line: "Answer: B", "Correct: True", "Key: 2"
      const ansMatch = line.match(/^(?:answer|correct|key|ans|solution)\s*[:\-]\s*(.+)/i)
      if (ansMatch) { correctToken = ansMatch[1].trim(); continue }

      // Type hint
      const typeMatch = line.match(/^type\s*[:\-]\s*(.+)/i)
      if (typeMatch) { typeHint = typeMatch[1].trim(); continue }

      // If nothing matched and we have no text yet, use as question text
      if (!text) text = line
    }

    if (!text) continue
    const cleanOpts = options.filter(Boolean)
    const fields = {
      text, correct: correctToken ?? '',
      type: typeHint ?? (cleanOpts.length >= 2 ? 'mcq_single' : ''),
      optA: cleanOpts[0], optB: cleanOpts[1], optC: cleanOpts[2],
      optD: cleanOpts[3], optE: cleanOpts[4],
    }
    const q = buildQuestion(fields)
    if (q) results.push(q)
  }

  return results
}

/* ── Master parse function ── */
export function parseAnyFormat(input) {
  const text = input.trim()
  if (!text) return []

  // 1. JSON
  if (text.startsWith('[') || text.startsWith('{')) {
    try { return parseJSON(text) } catch {}
  }

  // 2. Detect delimiter
  const firstLine = text.split('\n')[0]
  const delim = firstLine.includes('\t') ? '\t' : ','
  const lines = text.split('\n').filter(l => l.trim())

  // 3. Structured CSV/TSV (has recognised headers)
  if (lines.length >= 2 && looksLikeHeader(lines[0], delim)) {
    const result = parseStructured(lines, delim)
    if (result && result.length > 0) return result
  }

  // 4. Unstructured CSV/TSV (no headers, just data)
  if (delim === ',' || delim === '\t') {
    if (lines.length >= 1 && firstLine.includes(delim)) {
      const result = parseUnstructuredCSV(lines, delim)
      if (result && result.length > 0) return result
    }
  }

  // 5. Plain text
  return parsePlainText(text)
}

/* ═══════════════════════════════════════════════════════
   UI COMPONENTS
═══════════════════════════════════════════════════════ */

const TYPE_LABELS = {
  mcq_single: 'MCQ', mcq_multi: 'Multi', true_false: 'T/F',
  fill_blank: 'Fill', short: 'Short', essay: 'Essay',
  rating: 'Rating', matching: 'Match', ordering: 'Order', matrix: 'Matrix',
}

function StatusChip({ status }) {
  if (status === 'ok') return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
      <CheckCircle2 className="w-2.5 h-2.5" /> Ready
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
      <AlertTriangle className="w-2.5 h-2.5" /> Review
    </span>
  )
}

function AnswerPreview({ q }) {
  if (q.type === 'true_false') return <span className="text-xs text-slate-500">{q.payload?.correctAnswer ? 'True' : 'False'}</span>
  if (q.type === 'fill_blank') return <span className="text-xs text-slate-500">{q.payload?.correctAnswer || '—'}</span>
  if (q.type === 'mcq_single' || q.type === 'mcq_multi') {
    const opts = q.payload?.options ?? []
    const idx = q.payload?.correctIndex ?? 0
    return <span className="text-xs text-slate-500 truncate max-w-[120px]">{opts[idx] || `Option ${idx + 1}`}</span>
  }
  return <span className="text-xs text-slate-400 italic">Open-ended</span>
}

/* ── Drop zone + paste area (Step 1) ── */
function UploadStep({ onParsed }) {
  const [dragging, setDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  function process(text) {
    setError('')
    const results = parseAnyFormat(text)
    if (results.length === 0) {
      setError("Couldn't detect any questions. Try the examples below.")
      return
    }
    onParsed(results, text)
  }

  function handleFile(file) {
    const reader = new FileReader()
    reader.onload = e => process(e.target.result)
    reader.readAsText(file)
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [])

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-2xl px-6 py-10 flex flex-col items-center gap-3 cursor-pointer transition-all ${
          dragging ? 'border-[#FF6B9D] bg-[#FFF5F7]' : 'border-slate-200 bg-slate-50 hover:border-[#FFB3C6] hover:bg-[#FFF5F7]/40'
        }`}
      >
        <Upload className={`w-8 h-8 ${dragging ? 'text-[#FF6B9D]' : 'text-slate-300'}`} />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Drop a file here or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">Supports CSV, TSV, JSON, TXT — any format</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.json,.txt,.xls,.xlsx" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or paste directly</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Paste area */}
      <textarea
        value={pasteText}
        onChange={e => setPasteText(e.target.value)}
        rows={8}
        placeholder={
          `Paste questions in any format:\n\n` +
          `CSV:  Question, Option A, Option B, Option C, Option D, Correct\n` +
          `      What is 2+2?, 3, 4, 5, 6, B\n\n` +
          `JSON: [{"question":"...","options":[...],"answer":1}]\n\n` +
          `Text: 1. What is the capital of France?\n` +
          `      A) London   B) Paris *   C) Berlin\n` +
          `      Answer: B`
        }
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFB3C6] resize-none placeholder:text-slate-300"
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Format hints */}
      <details className="group">
        <summary className="flex items-center gap-1.5 text-xs text-[#E63E6D] cursor-pointer font-medium list-none">
          <Info className="w-3.5 h-3.5" /> Supported formats & examples
          <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-3 space-y-3">
          {[
            {
              label: 'CSV with headers',
              code: 'Question,Option A,Option B,Option C,Option D,Correct,Difficulty,Points\nWhat is the capital of France?,London,Paris,Berlin,Madrid,B,Easy,10\nTrue or False: Sky is blue,,,,, True,Easy,5'
            },
            {
              label: 'CSV without headers (auto-detected)',
              code: 'What is 2+2?,3,4,5,6,B\nWhich planet is closest to the Sun?,Venus,Mercury,Earth,Mars,B'
            },
            {
              label: 'JSON array',
              code: '[{"question":"What is TCP/IP?","options":["A protocol","An OS","A DB","A browser"],"answer":0,"difficulty":"Medium"},{"question":"True/False: HTTPS is secure","type":"true_false","answer":"True"}]'
            },
            {
              label: 'Plain text (numbered)',
              code: '1. What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nD) Madrid\nAnswer: B\n\n2. True or False: Light is faster than sound.\nAnswer: True'
            },
            {
              label: 'Pipe-separated with asterisk for correct',
              code: 'What is the chemical symbol for gold? | Silver | Au* | Gold | Ag\nWhat planet is closest to the Sun? | Venus | Mercury* | Earth | Mars'
            },
          ].map(({ label, code }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">{label}</p>
              <pre className="text-[10px] bg-slate-100 rounded-lg px-3 py-2 overflow-x-auto text-slate-600 whitespace-pre-wrap">{code}</pre>
            </div>
          ))}
        </div>
      </details>

      <div className="flex justify-end">
        <button
          onClick={() => { if (pasteText.trim()) process(pasteText) }}
          disabled={!pasteText.trim()}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] disabled:opacity-40 shadow-sm"
        >
          Parse Questions →
        </button>
      </div>
    </div>
  )
}

/* ── Preview / review table (Step 2) ── */
function PreviewStep({ questions, onBack, onImport, importing }) {
  const [rows, setRows] = useState(questions)
  const ready = rows.filter(r => !r._removed).length
  const issues = rows.filter(r => !r._removed && r._status !== 'ok').length

  function remove(i) { setRows(p => p.map((r, idx) => idx === i ? { ...r, _removed: true } : r)) }
  function restore(i) { setRows(p => p.map((r, idx) => idx === i ? { ...r, _removed: false } : r)) }
  function updateText(i, text) { setRows(p => p.map((r, idx) => idx === i ? { ...r, text } : r)) }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <p className="text-sm text-slate-700 flex-1">
          <strong>{ready}</strong> question{ready !== 1 ? 's' : ''} ready to import
          {issues > 0 && <span className="text-amber-600 ml-2">· {issues} may need review</span>}
        </p>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium">
          <RefreshCw className="w-3.5 h-3.5" /> Re-parse
        </button>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1.5rem_1fr_4.5rem_4.5rem_4rem_7rem_1.5rem] gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <span>#</span>
          <span>Question</span>
          <span>Type</span>
          <span>Correct Answer</span>
          <span>Pts</span>
          <span>Status</span>
          <span />
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          {rows.map((q, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1.5rem_1fr] sm:grid-cols-[1.5rem_1fr_4.5rem_4.5rem_4rem_7rem_1.5rem] gap-3 px-3 py-2.5 items-center transition-all ${q._removed ? 'opacity-30 bg-slate-50' : ''}`}
            >
              <span className="text-[11px] text-slate-400 font-mono">{i + 1}</span>
              <input
                value={q.text}
                onChange={e => updateText(i, e.target.value)}
                disabled={q._removed}
                className="text-[12px] text-slate-700 font-medium bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#FF6B9D]/60 focus:outline-none w-full min-w-0 truncate"
              />
              <span className="hidden sm:block text-[11px] font-semibold text-[#E63E6D] bg-[#FFF5F7] px-1.5 py-0.5 rounded-md w-fit">
                {TYPE_LABELS[q.type] ?? q.type}
              </span>
              <div className="hidden sm:block"><AnswerPreview q={q} /></div>
              <span className="hidden sm:block text-[12px] text-slate-500">{q.points}pt</span>
              <div className="hidden sm:block"><StatusChip status={q._status} /></div>
              <button
                onClick={() => q._removed ? restore(i) : remove(i)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${q._removed ? 'text-emerald-500 hover:text-emerald-700' : 'text-slate-300 hover:text-red-500'}`}
                title={q._removed ? 'Restore' : 'Remove'}
              >
                {q._removed ? <RefreshCw className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
          Back
        </button>
        <button
          onClick={() => onImport(rows.filter(r => !r._removed))}
          disabled={ready === 0 || importing}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] disabled:opacity-50 shadow-sm"
        >
          {importing ? 'Importing…' : `Import ${ready} Question${ready !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN MODAL
═══════════════════════════════════════════════════════ */
export default function QuestionImportModal({ onClose, onImported }) {
  const [step, setStep] = useState('upload')   // 'upload' | 'preview'
  const [parsed, setParsed]   = useState([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  function handleParsed(questions) {
    setParsed(questions)
    setStep('preview')
  }

  async function handleImport(questions) {
    setImporting(true)
    setImportError('')
    const created = []
    const failed = []
    try {
      for (const q of questions) {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: q.text,
            type: q.type,
            difficulty: q.difficulty,
            topic: q.topic,
            points: q.points,
            explanation: q.explanation,
            payload: q.payload ?? {},
          }),
        })
        if (res.ok) {
          created.push(await res.json())
        } else {
          const err = await res.json().catch(() => ({}))
          failed.push({ text: q.text?.slice(0, 50), reason: err.error ?? `HTTP ${res.status}` })
        }
      }
    } catch (e) {
      setImportError(`Network error: ${e.message ?? 'Please try again.'}`)
      setImporting(false)
      return
    }

    if (created.length > 0) onImported(created)

    if (failed.length === 0) {
      onClose()
    } else {
      const names = failed.slice(0, 3).map(f => `"${f.text}…" (${f.reason})`).join(', ')
      const more = failed.length > 3 ? ` and ${failed.length - 3} more` : ''
      setImportError(
        `${failed.length} question${failed.length !== 1 ? 's' : ''} failed to save: ${names}${more}.` +
        (created.length > 0 ? ` ${created.length} imported successfully.` : '')
      )
    }
    setImporting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Import Questions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 'upload' ? 'Upload or paste in any format — we\'ll handle the conversion' : 'Review detected questions before importing'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              {['upload', 'preview'].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step === s || (step === 'preview' && i === 0) ? 'bg-[#E63E6D] text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
                  {i === 0 && <div className={`w-4 h-0.5 ${step === 'preview' ? 'bg-[#FFB3C6]' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {importError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {importError}
            </div>
          )}
          {step === 'upload'
            ? <UploadStep onParsed={handleParsed} />
            : <PreviewStep questions={parsed} onBack={() => setStep('upload')} onImport={handleImport} importing={importing} />
          }
        </div>
      </div>
    </div>
  )
}
