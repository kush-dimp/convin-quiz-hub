import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Upload, Move, AlignLeft, AlignCenter, AlignRight,
  Eye, EyeOff, Plus, Trash2, GraduationCap,
} from 'lucide-react'

const CERT_W = 1056
const CERT_H  = 748

const FONT_OPTIONS = [
  { value: 'Georgia',   label: 'Georgia (Serif)' },
  { value: 'Inter',     label: 'Sans-serif'       },
  { value: 'monospace', label: 'Monospace'         },
]

const GRADIENT_PRESETS = [
  { color1: '#fefce8', color2: '#fef9c3' }, // Gold
  { color1: '#f0f9ff', color2: '#e0f2fe' }, // Sky
  { color1: '#fff1f2', color2: '#ffe4e6' }, // Rose
  { color1: '#f5f3ff', color2: '#ede9fe' }, // Violet
  { color1: '#ecfdf5', color2: '#d1fae5' }, // Emerald
  { color1: '#f8fafc', color2: '#f1f5f9' }, // Slate
]

const BORDER_STYLES = [
  { value: 'none',    label: 'None'    },
  { value: 'thin',    label: 'Thin'    },
  { value: 'classic', label: 'Classic' },
  { value: 'double',  label: 'Double'  },
]

function makeDefaultElements(accent = '#7C3AED') {
  return [
    { id: 'heading',   type: 'static',   text: '✦ Certificate of Achievement ✦',   x: 50, y:  9, fontSize: 11, fontFamily: 'Georgia',   fontWeight: '400', color: accent,    align: 'center', letterSpacing: 5,   uppercase: true,  visible: true },
    { id: 'sub1',      type: 'static',   text: 'This certifies that',               x: 50, y: 36, fontSize: 14, fontFamily: 'Inter',     fontWeight: '400', color: '#78716c', align: 'center', letterSpacing: 3,   uppercase: true,  visible: true },
    { id: 'name',      type: 'variable', variable: 'userName',  label: 'Recipient Name', placeholder: 'John Doe',           x: 50, y: 48, fontSize: 52, fontFamily: 'Georgia',   fontWeight: '700', color: '#1c1917', align: 'center', letterSpacing: 0,   uppercase: false, visible: true },
    { id: 'sub2',      type: 'static',   text: 'has successfully completed',        x: 50, y: 63, fontSize: 14, fontFamily: 'Inter',     fontWeight: '400', color: '#78716c', align: 'center', letterSpacing: 2,   uppercase: true,  visible: true },
    { id: 'quizTitle', type: 'variable', variable: 'quizTitle', label: 'Quiz Title',     placeholder: 'Advanced JavaScript', x: 50, y: 73, fontSize: 26, fontFamily: 'Inter',     fontWeight: '700', color: accent,    align: 'center', letterSpacing: 0,   uppercase: false, visible: true },
    { id: 'score',     type: 'variable', variable: 'score',     label: 'Score',          placeholder: 'Score: 95%',          x: 50, y: 82, fontSize: 15, fontFamily: 'Inter',     fontWeight: '400', color: '#57534e', align: 'center', letterSpacing: 0,   uppercase: false, visible: true },
    { id: 'date',      type: 'variable', variable: 'date',      label: 'Date Issued',    placeholder: 'January 1, 2025',     x: 22, y: 91, fontSize: 12, fontFamily: 'Inter',     fontWeight: '400', color: '#78716c', align: 'left',   letterSpacing: 0,   uppercase: false, visible: true },
    { id: 'certId',    type: 'variable', variable: 'certId',    label: 'Certificate ID', placeholder: '#ABCD1234',            x: 78, y: 91, fontSize: 11, fontFamily: 'monospace', fontWeight: '400', color: '#a8a29e', align: 'right',  letterSpacing: 0,   uppercase: false, visible: true },
  ]
}

function getFontFamily(f) {
  if (f === 'Georgia')   return 'Georgia, "Times New Roman", serif'
  if (f === 'monospace') return '"Courier New", Courier, monospace'
  return '"Inter", "DM Sans", system-ui, sans-serif'
}

export function getBackgroundStyle(bg) {
  if (!bg) return { background: '#fff' }
  if (bg.type === 'solid') return { background: bg.color1 || '#fff' }
  if (bg.type === 'image' && bg.imageDataUrl) return {
    backgroundImage: `url(${bg.imageDataUrl})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  }
  return {
    background: `linear-gradient(${bg.direction || '135deg'}, ${bg.color1 || '#fefce8'} 0%, ${bg.color2 || '#fef9c3'} 100%)`,
  }
}

export function BorderLayer({ style, color }) {
  if (!style || style === 'none') return null
  const c = color || '#7C3AED'
  if (style === 'classic') return (
    <>
      <div style={{ position: 'absolute', inset: 16, border: `3px solid ${c}`, borderRadius: 4, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 24, border: `1px solid ${c}`, borderRadius: 2, opacity: 0.5, pointerEvents: 'none', zIndex: 1 }} />
      {[{ top: 30, left: 30 }, { top: 30, right: 30 }, { bottom: 30, left: 30 }, { bottom: 30, right: 30 }].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 40, height: 40, border: `2px solid ${c}`, pointerEvents: 'none', zIndex: 1,
          ...(i===0?{borderRight:'none',borderBottom:'none'}:i===1?{borderLeft:'none',borderBottom:'none'}:i===2?{borderRight:'none',borderTop:'none'}:{borderLeft:'none',borderTop:'none'}) }} />
      ))}
    </>
  )
  if (style === 'double') return (
    <>
      <div style={{ position: 'absolute', inset: 12, border: `2px solid ${c}`, borderRadius: 4, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 20, border: `1px solid ${c}`, opacity: 0.6, borderRadius: 2, pointerEvents: 'none', zIndex: 1 }} />
    </>
  )
  return <div style={{ position: 'absolute', inset: 20, border: `1.5px solid ${c}`, borderRadius: 4, pointerEvents: 'none', zIndex: 1 }} />
}

/* ── Image upload helper ─────────────────────────────────── */
function ImgUpload({ value, onUpload, placeholder }) {
  const ref = useRef(null)
  function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpload(ev.target.result)
    reader.readAsDataURL(file); e.target.value = ''
  }
  return (
    <div>
      <input type="file" ref={ref} onChange={handleFile} accept="image/*" className="hidden" />
      <button onClick={() => ref.current?.click()}
        className="w-full h-24 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#FF6B9D]/50 hover:bg-white/5 transition-colors">
        {value
          ? <img src={value} alt="" className="max-h-16 max-w-full object-contain rounded" />
          : (<><Upload className="w-4 h-4 text-white/30" /><span className="text-xs text-white/30">{placeholder || 'Click to upload'}</span></>)
        }
      </button>
      {value && <button onClick={() => onUpload(null)} className="mt-1 text-[11px] text-red-400/60 hover:text-red-400 w-full text-center">Remove</button>}
    </div>
  )
}

/* ── Color picker row ────────────────────────────────────── */
function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[11px] text-white/40 w-12 shrink-0">{label}</span>}
      <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer p-0.5 border border-white/20 bg-transparent flex-shrink-0" />
      <input value={value || '#ffffff'} onChange={e => onChange(e.target.value)}
        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF6B9D]" />
    </div>
  )
}

function FieldLabel({ children }) {
  return <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 mt-4 first:mt-0">{children}</p>
}
function Field({ label, children }) {
  return <div><FieldLabel>{label}</FieldLabel>{children}</div>
}
function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? 'bg-[#E63E6D] text-white' : 'bg-white/10 text-white/50 hover:bg-white/15 hover:text-white/70'}`}>
      {label}
    </button>
  )
}

/* ── Interactive canvas ──────────────────────────────────── */
function BuilderCanvas({ bg, border, logo, logoPos, elements, selectedId, onSelect, onMove, scale }) {
  const dragRef = useRef(null)

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragRef.current) return
      const { id, sx, sy, ox, oy } = dragRef.current
      const dx = ((e.clientX - sx) / scale / CERT_W) * 100
      const dy = ((e.clientY - sy) / scale / CERT_H) * 100
      onMove(id, Math.max(1, Math.min(99, ox + dx)), Math.max(2, Math.min(97, oy + dy)))
    }
    function onMouseUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [scale, onMove])

  function startDrag(e, el) {
    e.stopPropagation(); e.preventDefault()
    onSelect(el.id)
    dragRef.current = { id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y }
  }

  return (
    <div
      style={{ width: CERT_W * scale, height: CERT_H * scale, position: 'relative', overflow: 'hidden', flexShrink: 0, borderRadius: 6, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
      onClick={() => onSelect(null)}
    >
      <div style={{ width: CERT_W, height: CERT_H, position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left', ...getBackgroundStyle(bg), overflow: 'hidden', boxSizing: 'border-box' }}>
        <BorderLayer style={border?.style} color={border?.color} />

        {logo && (
          <img src={logo} alt="Logo" style={{ position: 'absolute', left: `${logoPos?.x ?? 50}%`, top: `${logoPos?.y ?? 6}%`, transform: 'translateX(-50%)', maxHeight: `${logoPos?.height ?? 50}px`, maxWidth: 220, objectFit: 'contain', pointerEvents: 'none', zIndex: 2 }} />
        )}

        {elements.filter(e => e.visible !== false).map(el => {
          const isSel = el.id === selectedId
          const text  = el.type === 'variable' ? (el.placeholder || el.label) : (el.text || '')
          return (
            <div
              key={el.id}
              onMouseDown={e => startDrag(e, el)}
              style={{
                position: 'absolute', left: `${el.x}%`, top: `${el.y}%`,
                transform: `translate(${el.align === 'center' ? '-50%' : el.align === 'right' ? '-100%' : '0'}, -50%)`,
                fontSize: el.fontSize, fontFamily: getFontFamily(el.fontFamily),
                fontWeight: el.fontWeight || 400, color: el.color || '#000',
                textAlign: el.align || 'left',
                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                textTransform: el.uppercase ? 'uppercase' : 'none',
                cursor: 'move', userSelect: 'none', whiteSpace: 'nowrap', zIndex: 3,
                outline: isSel ? '2px dashed #E63E6D' : '1px dashed rgba(0,0,0,0.08)',
                outlineOffset: 6,
                background: isSel ? 'rgba(230,62,109,0.07)' : 'transparent',
                padding: '2px 4px', borderRadius: 2,
              }}
            >
              {text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main builder component ──────────────────────────────── */
export default function CertificateBuilder({ onClose, quizzes = [] }) {
  const [name,       setName]       = useState('My Custom Template')
  const [bg,         setBg]         = useState({ type: 'gradient', color1: '#fefce8', color2: '#fef9c3', direction: '135deg', imageDataUrl: null })
  const [border,     setBorder]     = useState({ style: 'classic', color: '#7C3AED' })
  const [logo,       setLogo]       = useState(null)
  const [logoPos,    setLogoPos]    = useState({ x: 50, y: 6, height: 50 })
  const [elements,   setElements]   = useState(() => makeDefaultElements('#7C3AED'))
  const [selectedId, setSelectedId] = useState(null)
  const [leftTab,    setLeftTab]    = useState('design')
  const [quizId,     setQuizId]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [scale,      setScale]      = useState(0.58)

  useEffect(() => {
    function compute() {
      const w = Math.max(350, window.innerWidth  - 580)
      const h = Math.max(280, window.innerHeight - 120)
      setScale(parseFloat(Math.min(w / CERT_W, h / CERT_H, 0.80).toFixed(3)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const selectedEl = elements.find(e => e.id === selectedId) ?? null

  const updateEl = useCallback((id, patch) =>
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e)), [])

  const moveEl = useCallback((id, x, y) => updateEl(id, { x, y }), [updateEl])

  function addCustomText() {
    const id = `custom_${Date.now()}`
    setElements(prev => [...prev, {
      id, type: 'static', text: 'Custom Text', x: 50, y: 50,
      fontSize: 16, fontFamily: 'Inter', fontWeight: '400',
      color: '#1c1917', align: 'center', letterSpacing: 0, uppercase: false, visible: true,
    }])
    setSelectedId(id)
  }

  function deleteEl(id) {
    setElements(prev => prev.filter(e => e.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function buildConfig() {
    return { type: 'custom', name, background: bg, border, logoDataUrl: logo, logoPos, elements }
  }

  async function handleSave() {
    const config = buildConfig()
    if (!quizId) {
      // Save to localStorage as named template
      const stored = JSON.parse(localStorage.getItem('cert_custom_templates') || '[]')
      const idx = stored.findIndex(t => t.name === name)
      if (idx >= 0) stored[idx] = config; else stored.push(config)
      localStorage.setItem('cert_custom_templates', JSON.stringify(stored))
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      return
    }
    setSaving(true)
    try {
      const templateJson = JSON.stringify({ template: 'custom', customConfig: config })
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_template: templateJson, certificate_enabled: true }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose(config) }, 1200)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#0d0812', fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-white/10 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6B9D] to-[#E63E6D] flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <input
          value={name} onChange={e => setName(e.target.value)}
          className="bg-transparent text-white text-sm font-semibold focus:outline-none border-b border-transparent focus:border-white/30 px-1 py-0.5 w-52"
          placeholder="Template name…"
        />
        <span className="text-white/15 text-sm select-none">|</span>
        <p className="text-xs text-white/30 hidden sm:block">Drag elements on canvas · Click to select and style</p>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {quizzes.length > 0 && (
            <select
              value={quizId} onChange={e => setQuizId(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF6B9D] max-w-[220px]"
            >
              <option value="" style={{ background: '#1a0d20' }}>Save as template only…</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id} style={{ background: '#1a0d20' }}>{q.title}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleSave} disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-60 ${saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white'}`}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving…' : quizId ? 'Save & Apply to Quiz' : 'Save Template'}
          </button>
          <button onClick={() => onClose(null)} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="w-[260px] flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* Tabs */}
          <div className="flex gap-1 p-2 border-b border-white/8 flex-shrink-0">
            {[['design','Design'],['logo','Logo'],['elements','Elements']].map(([tab, label]) => (
              <button key={tab} onClick={() => setLeftTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${leftTab === tab ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/55'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* ── Design tab ── */}
            {leftTab === 'design' && (
              <div className="space-y-1">
                <Field label="Background Type">
                  <div className="flex gap-1">
                    {[['gradient','Gradient'],['solid','Solid'],['image','Upload Image']].map(([t, l]) => (
                      <Pill key={t} label={l} active={bg.type === t} onClick={() => setBg(p => ({ ...p, type: t }))} />
                    ))}
                  </div>
                </Field>

                {bg.type === 'gradient' && (
                  <>
                    <FieldLabel>Presets</FieldLabel>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {GRADIENT_PRESETS.map((p, i) => (
                        <button key={i} onClick={() => setBg(prev => ({ ...prev, ...p }))}
                          style={{ background: `linear-gradient(135deg, ${p.color1}, ${p.color2})` }}
                          className={`h-9 rounded-lg border-2 transition-all ${bg.color1 === p.color1 && bg.color2 === p.color2 ? 'border-[#E63E6D] scale-105 shadow-lg shadow-[#E63E6D]/20' : 'border-transparent hover:border-white/30'}`} />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <ColorRow label="Start" value={bg.color1} onChange={v => setBg(p => ({ ...p, color1: v }))} />
                      <ColorRow label="End"   value={bg.color2} onChange={v => setBg(p => ({ ...p, color2: v }))} />
                    </div>
                  </>
                )}

                {bg.type === 'solid' && (
                  <ColorRow label="Color" value={bg.color1 || '#ffffff'} onChange={v => setBg(p => ({ ...p, color1: v }))} />
                )}

                {bg.type === 'image' && (
                  <ImgUpload
                    placeholder="Upload your certificate design (PNG/JPG)"
                    value={bg.imageDataUrl}
                    onUpload={d => setBg(p => ({ ...p, imageDataUrl: d }))}
                  />
                )}

                <Field label="Border Style">
                  <div className="flex gap-1 flex-wrap">
                    {BORDER_STYLES.map(s => (
                      <Pill key={s.value} label={s.label} active={border.style === s.value} onClick={() => setBorder(p => ({ ...p, style: s.value }))} />
                    ))}
                  </div>
                </Field>

                {border.style !== 'none' && (
                  <ColorRow label="Color" value={border.color} onChange={v => setBorder(p => ({ ...p, color: v }))} />
                )}
              </div>
            )}

            {/* ── Logo tab ── */}
            {leftTab === 'logo' && (
              <div className="space-y-1">
                <Field label="Logo Image">
                  <ImgUpload placeholder="Upload logo (PNG recommended)" value={logo} onUpload={setLogo} />
                </Field>
                {logo && (
                  <Field label="Position & Size">
                    <div className="space-y-3 mt-1">
                      {[
                        { label: 'Horizontal %', key: 'x',      min: 5,  max: 95, val: logoPos.x      },
                        { label: 'Vertical %',   key: 'y',      min: 2,  max: 40, val: logoPos.y      },
                        { label: 'Height (px)',  key: 'height', min: 20, max: 140, val: logoPos.height },
                      ].map(({ label, key, min, max, val }) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] text-white/40">{label}</span>
                            <span className="text-[11px] text-white/50 font-mono">{val}{key !== 'height' ? '%' : 'px'}</span>
                          </div>
                          <input type="range" min={min} max={max} value={val}
                            onChange={e => setLogoPos(p => ({ ...p, [key]: Number(e.target.value) }))}
                            className="w-full accent-[#E63E6D]" />
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
              </div>
            )}

            {/* ── Elements tab ── */}
            {leftTab === 'elements' && (
              <div>
                <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
                  Click elements on the canvas to select and style them. Toggle visibility here.
                </p>
                <div className="space-y-1">
                  {elements.map(el => (
                    <div key={el.id}
                      onClick={() => setSelectedId(el.id === selectedId ? null : el.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${el.id === selectedId ? 'bg-[#E63E6D]/20 border border-[#E63E6D]/30' : 'hover:bg-white/6 border border-transparent'}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${el.type === 'variable' ? 'bg-[#FF6B9D]' : 'bg-white/25'}`} />
                      <span className="text-xs text-white/65 flex-1 truncate">
                        {el.type === 'variable' ? el.label : (el.text?.substring(0, 24) + (el.text?.length > 24 ? '…' : ''))}
                      </span>
                      <button onClick={e => { e.stopPropagation(); updateEl(el.id, { visible: el.visible === false }) }}
                        className="text-white/25 hover:text-white/60 flex-shrink-0 transition-colors">
                        {el.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {el.type === 'static' && el.id.startsWith('custom_') && (
                        <button onClick={e => { e.stopPropagation(); deleteEl(el.id) }}
                          className="text-red-400/40 hover:text-red-400 flex-shrink-0 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addCustomText}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/15 rounded-xl text-xs text-white/35 hover:border-[#FF6B9D]/40 hover:text-white/55 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Custom Text
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Canvas Area ── */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-6 min-w-0">
          <BuilderCanvas
            bg={bg} border={border} logo={logo} logoPos={logoPos}
            elements={elements} selectedId={selectedId}
            onSelect={setSelectedId} onMove={moveEl} scale={scale}
          />
        </div>

        {/* ── Right Panel: Style Controls ── */}
        <div className="w-[260px] flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider">
              {selectedEl ? 'Element Style' : 'Select an Element'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedEl ? (
              <div className="space-y-1">
                {/* Static text content */}
                {selectedEl.type === 'static' && (
                  <Field label="Text Content">
                    <textarea
                      value={selectedEl.text || ''} rows={2}
                      onChange={e => updateEl(selectedEl.id, { text: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-[#FF6B9D]"
                    />
                  </Field>
                )}

                {selectedEl.type === 'variable' && (
                  <div className="bg-[#FF6B9D]/10 border border-[#FF6B9D]/20 rounded-xl px-3 py-2.5 mt-1">
                    <p className="text-[10px] text-[#FF6B9D]/70 uppercase tracking-wider mb-0.5">Dynamic Variable</p>
                    <code className="text-xs text-[#FF6B9D] font-mono">{`{${selectedEl.variable}}`}</code>
                    <p className="text-[10px] text-white/25 mt-1">Auto-filled from quiz results</p>
                  </div>
                )}

                <Field label="Font Family">
                  <select value={selectedEl.fontFamily || 'Inter'}
                    onChange={e => updateEl(selectedEl.id, { fontFamily: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B9D]">
                    {FONT_OPTIONS.map(f => <option key={f.value} value={f.value} style={{ background: '#1a0d20' }}>{f.label}</option>)}
                  </select>
                </Field>

                <Field label={`Font Size: ${selectedEl.fontSize}px`}>
                  <input type="range" min="8" max="72" value={selectedEl.fontSize}
                    onChange={e => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })}
                    className="w-full accent-[#E63E6D]" />
                </Field>

                <Field label="Color">
                  <ColorRow value={selectedEl.color || '#000000'}
                    onChange={v => updateEl(selectedEl.id, { color: v })} />
                </Field>

                <Field label="Font Weight">
                  <div className="flex gap-1">
                    {[['400','Regular'],['600','Semi'],['700','Bold']].map(([w, l]) => (
                      <Pill key={w} label={l} active={selectedEl.fontWeight === w}
                        onClick={() => updateEl(selectedEl.id, { fontWeight: w })} />
                    ))}
                  </div>
                </Field>

                <Field label="Alignment">
                  <div className="flex gap-1">
                    {[['left', <AlignLeft className="w-3.5 h-3.5" />], ['center', <AlignCenter className="w-3.5 h-3.5" />], ['right', <AlignRight className="w-3.5 h-3.5" />]].map(([a, icon]) => (
                      <button key={a} onClick={() => updateEl(selectedEl.id, { align: a })}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-colors ${selectedEl.align === a ? 'bg-[#E63E6D] text-white' : 'bg-white/10 text-white/40 hover:bg-white/15'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={`Letter Spacing: ${selectedEl.letterSpacing || 0}px`}>
                  <input type="range" min="0" max="12" step="0.5" value={selectedEl.letterSpacing || 0}
                    onChange={e => updateEl(selectedEl.id, { letterSpacing: Number(e.target.value) })}
                    className="w-full accent-[#E63E6D]" />
                </Field>

                <Field label="Text Transform">
                  <button onClick={() => updateEl(selectedEl.id, { uppercase: !selectedEl.uppercase })}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${selectedEl.uppercase ? 'bg-[#E63E6D] text-white' : 'bg-white/10 text-white/45'}`}>
                    {selectedEl.uppercase ? 'UPPERCASE ON' : 'Normal case'}
                  </button>
                </Field>

                <Field label="Visibility">
                  <button onClick={() => updateEl(selectedEl.id, { visible: selectedEl.visible === false })}
                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${selectedEl.visible !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/35'}`}>
                    {selectedEl.visible !== false
                      ? <><Eye className="w-3 h-3" /> Visible</>
                      : <><EyeOff className="w-3 h-3" /> Hidden</>
                    }
                  </button>
                </Field>

                <Field label="Position (X / Y %)">
                  <div className="grid grid-cols-2 gap-2">
                    {[['x','X %'],['y','Y %']].map(([key, label]) => (
                      <div key={key}>
                        <p className="text-[9px] text-white/25 mb-1">{label}</p>
                        <input type="number" min="0" max="100" value={Math.round(selectedEl[key])}
                          onChange={e => updateEl(selectedEl.id, { [key]: Number(e.target.value) })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF6B9D]" />
                      </div>
                    ))}
                  </div>
                </Field>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Move className="w-8 h-8 text-white/15 mb-3" />
                <p className="text-xs text-white/25 leading-relaxed">
                  Click any element<br />on the canvas to<br />select and style it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
