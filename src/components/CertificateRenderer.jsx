// CertificateRenderer.jsx
// Fixed canvas: 1056 × 748px (landscape A4 @ 96dpi)
// Parent scales with transform: scale(factor) from outside.
// @media print hides siblings and shows only the cert div.

const CERT_W = 1056
const CERT_H = 748

function formatDate(iso) {
  if (!iso) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function shortId(id) {
  return id ? String(id).replace(/-/g, '').slice(0, 8).toUpperCase() : 'XXXXXXXX'
}

// ── Classic Template ───────────────────────────────────────────────────────
function ClassicTemplate({ cert, quizTitle, userName, scorePct, instructorName, primaryColor }) {
  const color = primaryColor || '#7C3AED'
  return (
    <div style={{
      width: CERT_W, height: CERT_H,
      background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 40%, #fefce8 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', fontFamily: 'Georgia, "Times New Roman", serif',
      boxSizing: 'border-box',
    }}>
      {/* Outer decorative border */}
      <div style={{
        position: 'absolute', inset: 16,
        border: `3px solid ${color}`,
        borderRadius: 4,
        pointerEvents: 'none',
      }} />
      {/* Inner decorative border */}
      <div style={{
        position: 'absolute', inset: 24,
        border: `1px solid ${color}`,
        borderRadius: 2,
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      {/* Corner ornaments */}
      {[
        { top: 30, left: 30 }, { top: 30, right: 30 },
        { bottom: 30, left: 30 }, { bottom: 30, right: 30 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: 40, height: 40,
          border: `2px solid ${color}`,
          pointerEvents: 'none',
          ...( i === 0 ? { borderRight: 'none', borderBottom: 'none' }
            : i === 1 ? { borderLeft: 'none', borderBottom: 'none' }
            : i === 2 ? { borderRight: 'none', borderTop: 'none' }
            :            { borderLeft: 'none', borderTop: 'none' }),
        }} />
      ))}

      {/* Header label */}
      <div style={{
        position: 'absolute', top: 52,
        fontSize: 11, letterSpacing: 6, textTransform: 'uppercase',
        color: color, fontFamily: 'Georgia, serif', opacity: 0.8,
      }}>
        ✦ Certificate of Achievement ✦
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center', padding: '0 100px', zIndex: 1 }}>
        <p style={{ fontSize: 14, color: '#78716c', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
          This certifies that
        </p>
        <div style={{
          fontSize: 52, fontWeight: 700, color: '#1c1917',
          marginBottom: 8, lineHeight: 1.1,
          borderBottom: `2px solid ${color}`,
          paddingBottom: 12, marginLeft: 40, marginRight: 40,
        }}>
          {userName || 'Recipient Name'}
        </div>
        <p style={{ fontSize: 14, color: '#78716c', letterSpacing: 2, textTransform: 'uppercase', margin: '16px 0 8px' }}>
          has successfully completed
        </p>
        <p style={{ fontSize: 26, fontWeight: 700, color: color, marginBottom: 8 }}>
          {quizTitle || 'Quiz Title'}
        </p>
        <p style={{ fontSize: 15, color: '#57534e', marginBottom: 0 }}>
          with a score of <strong style={{ color: '#1c1917' }}>{scorePct != null ? `${scorePct}%` : '—'}</strong>
        </p>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 52, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '0 80px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: `1.5px solid #a8a29e`, width: 180, marginBottom: 4 }} />
          <p style={{ fontSize: 12, color: '#78716c', margin: 0 }}>{instructorName || 'Instructor'}</p>
          <p style={{ fontSize: 10, color: '#a8a29e', margin: '2px 0 0', letterSpacing: 1, textTransform: 'uppercase' }}>Authorized Signature</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#78716c', margin: 0 }}>{formatDate(cert?.issued_at)}</p>
          <p style={{ fontSize: 10, color: '#a8a29e', margin: '2px 0 0', letterSpacing: 1, textTransform: 'uppercase' }}>Date Issued</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#78716c', margin: 0, fontFamily: 'monospace' }}>#{shortId(cert?.id)}</p>
          <p style={{ fontSize: 10, color: '#a8a29e', margin: '2px 0 0', letterSpacing: 1, textTransform: 'uppercase' }}>Certificate ID</p>
        </div>
      </div>
    </div>
  )
}

// ── Modern Template ────────────────────────────────────────────────────────
function ModernTemplate({ cert, quizTitle, userName, scorePct, instructorName, primaryColor }) {
  const color = primaryColor || '#4F46E5'
  return (
    <div style={{
      width: CERT_W, height: CERT_H,
      background: '#ffffff',
      display: 'flex', flexDirection: 'row',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      boxSizing: 'border-box', overflow: 'hidden',
    }}>
      {/* Left accent strip */}
      <div style={{
        width: 220, background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', flexShrink: 0,
      }}>
        {/* Badge circle */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, background: 'rgba(255,255,255,0.15)',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M12 14l-4 6 4-2 4 2-4-6" />
          </svg>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 32 }}>
          Certificate of<br />Achievement
        </p>

        <div style={{ marginTop: 'auto', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 2 }}>Score Achieved</p>
          <p style={{ color: 'white', fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1 }}>{scorePct != null ? `${scorePct}%` : '—'}</p>
        </div>
      </div>

      {/* Right content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '56px 64px',
      }}>
        {/* Top */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
            <div style={{ width: 32, height: 3, background: color, borderRadius: 2 }} />
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
              Official Recognition
            </p>
          </div>

          <p style={{ fontSize: 14, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Proudly presented to
          </p>
          <h1 style={{
            fontSize: 48, fontWeight: 800, color: '#0f172a',
            margin: '0 0 20px', lineHeight: 1.1,
            letterSpacing: -1,
          }}>
            {userName || 'Recipient Name'}
          </h1>

          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 6, lineHeight: 1.6 }}>
            For the successful completion of
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: color, margin: '0 0 6px', lineHeight: 1.3 }}>
            {quizTitle || 'Quiz Title'}
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Demonstrating exceptional knowledge and proficiency
          </p>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ height: 1.5, width: 160, background: '#e2e8f0', marginBottom: 6 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>{instructorName || 'Instructor'}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Course Instructor</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>Issued on</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>{formatDate(cert?.issued_at)}</p>
            <p style={{ fontSize: 10, color: '#cbd5e1', margin: '4px 0 0', fontFamily: 'monospace', letterSpacing: 1 }}>
              ID: {shortId(cert?.id)}
            </p>
          </div>
        </div>
      </div>

      {/* Right side decorative line */}
      <div style={{ width: 6, background: `linear-gradient(180deg, ${color}22 0%, ${color} 50%, ${color}22 100%)` }} />
    </div>
  )
}

// ── Minimalist Template ────────────────────────────────────────────────────
function MinimalistTemplate({ cert, quizTitle, userName, scorePct, instructorName, primaryColor }) {
  const color = primaryColor || '#18181b'
  return (
    <div style={{
      width: CERT_W, height: CERT_H,
      background: '#ffffff',
      border: `1.5px solid #e4e4e7`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      boxSizing: 'border-box', padding: '60px 100px',
      position: 'relative',
    }}>
      {/* Thin top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 80, right: 80,
        height: 3, background: color,
      }} />

      <div style={{ textAlign: 'center', width: '100%' }}>
        <p style={{
          fontSize: 10, letterSpacing: 4, textTransform: 'uppercase',
          color: '#a1a1aa', marginBottom: 48,
        }}>
          Certificate of Completion
        </p>

        <p style={{ fontSize: 15, color: '#71717a', marginBottom: 16 }}>This is to certify that</p>

        <h1 style={{
          fontSize: 54, fontWeight: 700, color: '#18181b',
          margin: '0 0 20px', letterSpacing: -2, lineHeight: 1,
        }}>
          {userName || 'Recipient Name'}
        </h1>

        <div style={{ width: 64, height: 1.5, background: color, margin: '0 auto 20px', opacity: 0.3 }} />

        <p style={{ fontSize: 15, color: '#71717a', marginBottom: 10 }}>
          has successfully completed
        </p>
        <p style={{ fontSize: 24, fontWeight: 600, color: color, marginBottom: 8 }}>
          {quizTitle || 'Quiz Title'}
        </p>
        <p style={{ fontSize: 14, color: '#a1a1aa' }}>
          with a score of {scorePct != null ? `${scorePct}%` : '—'}
        </p>
      </div>

      <div style={{
        position: 'absolute', bottom: 52, left: 100, right: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid #f4f4f5', paddingTop: 20,
      }}>
        <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>
          <span style={{ color: '#a1a1aa', fontSize: 10 }}>Instructor</span><br />
          {instructorName || 'Instructor'}
        </p>
        <p style={{ fontSize: 12, color: '#71717a', margin: 0, textAlign: 'right' }}>
          <span style={{ color: '#a1a1aa', fontSize: 10 }}>Date Issued</span><br />
          {formatDate(cert?.issued_at)}
        </p>
        <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0, textAlign: 'right', fontFamily: 'monospace' }}>
          <span style={{ fontSize: 10, display: 'block' }}>Certificate ID</span>
          #{shortId(cert?.id)}
        </p>
      </div>
    </div>
  )
}

// ── Corporate Template ─────────────────────────────────────────────────────
function CorporateTemplate({ cert, quizTitle, userName, scorePct, instructorName, primaryColor }) {
  const color = primaryColor || '#1e40af'
  return (
    <div style={{
      width: CERT_W, height: CERT_H,
      background: '#f8fafc',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      boxSizing: 'border-box', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
        padding: '28px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>Convin Assess</p>
            <p style={{ color: '#94a3b8', fontSize: 10, margin: 0, letterSpacing: 1.5, textTransform: 'uppercase' }}>Professional Certification</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#94a3b8', fontSize: 10, margin: '0 0 2px', letterSpacing: 1, textTransform: 'uppercase' }}>Certificate ID</p>
          <p style={{ color: 'white', fontSize: 13, fontFamily: 'monospace', margin: 0 }}>#{shortId(cert?.id)}</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 56px 40px' }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: color, marginBottom: 8 }}>
            Certificate of Achievement
          </p>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 12 }}>This certificate is awarded to</p>
          <h1 style={{
            fontSize: 46, fontWeight: 800, color: '#0f172a',
            margin: '0 0 8px', letterSpacing: -1.5, lineHeight: 1,
          }}>
            {userName || 'Recipient Name'}
          </h1>
          <div style={{ width: 72, height: 4, background: color, borderRadius: 2, marginBottom: 20 }} />
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>
            For the successful completion of
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
            {quizTitle || 'Quiz Title'}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Score Achieved', value: scorePct != null ? `${scorePct}%` : '—', accent: true },
            { label: 'Status', value: 'Passed', accent: false },
            { label: 'Date Issued', value: formatDate(cert?.issued_at), accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              background: accent ? color : 'white',
              borderRadius: 10, padding: '16px 20px',
              border: accent ? 'none' : '1px solid #e2e8f0',
            }}>
              <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: accent ? 'rgba(255,255,255,0.7)' : '#94a3b8', margin: '0 0 4px' }}>
                {label}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: accent ? 'white' : '#1e293b', margin: 0, lineHeight: 1.2 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Signature row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginTop: 'auto' }}>
          <div>
            <div style={{ height: 1, width: 160, background: '#cbd5e1', marginBottom: 6 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>{instructorName || 'Instructor'}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Authorized Signatory</p>
          </div>
          <div style={{
            marginLeft: 'auto', padding: '8px 16px',
            background: '#f1f5f9', borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px', letterSpacing: 1, textTransform: 'uppercase' }}>Verified</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>Convin Assess</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${color} 0%, #7c3aed 100%)` }} />
    </div>
  )
}

// ── Main exported component ────────────────────────────────────────────────
export default function CertificateRenderer({
  cert,
  quizTitle,
  userName,
  scorePct,
  instructorName = 'Quiz Instructor',
  template = 'classic',
  primaryColor,
}) {
  const props = { cert, quizTitle, userName, scorePct, instructorName, primaryColor }

  let inner
  if (template === 'modern')     inner = <ModernTemplate {...props} />
  else if (template === 'minimalist') inner = <MinimalistTemplate {...props} />
  else if (template === 'corporate')  inner = <CorporateTemplate {...props} />
  else                           inner = <ClassicTemplate {...props} />

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #cert-print-root { display: block !important; position: fixed; top: 0; left: 0; }
          #cert-print-root * { display: revert !important; }
        }
      `}</style>
      <div
        id="cert-print-root"
        style={{ width: CERT_W, height: CERT_H, overflow: 'hidden', position: 'relative' }}
      >
        {inner}
      </div>
    </>
  )
}

export { CERT_W, CERT_H }
