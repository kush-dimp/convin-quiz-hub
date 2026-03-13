/**
 * Certificate email helper — sends via Resend REST API (no npm package needed).
 * Requires: RESEND_API_KEY env var.
 * Optional: RESEND_FROM_EMAIL (defaults to onboarding@resend.dev for testing)
 *           APP_URL (defaults to quiz-platform-mauve.vercel.app)
 */

function shortId(id) {
  return id ? String(id).replace(/-/g, '').slice(0, 8).toUpperCase() : '--------'
}

function fmtDate(iso) {
  if (!iso) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function buildHtml({ name, quizTitle, scorePct, certId, issuedAt, primaryColor, appUrl }) {
  const color   = primaryColor || '#4F46E5'
  const sid     = shortId(certId)
  const date    = fmtDate(issuedAt)
  const certUrl = `${appUrl}/certificates`

  // Darken the primary colour slightly for gradient end
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your Certificate</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',system-ui,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px">

        <!-- Gradient header -->
        <tr>
          <td style="background:linear-gradient(135deg,${color} 0%,${color}cc 100%);
                     padding:36px 40px;text-align:center">
            <div style="display:inline-block;width:64px;height:64px;border-radius:50%;
                        background:rgba(255,255,255,0.2);margin-bottom:16px;
                        line-height:64px;font-size:32px">🎓</div>
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;
                       letter-spacing:-0.5px">Certificate of Achievement</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">
              QuizPlatform
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px">

            <p style="color:#64748b;font-size:15px;margin:0 0 6px">Hi ${name},</p>
            <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 24px;
                       letter-spacing:-0.5px">
              Congratulations — you passed! 🎉
            </h2>

            <!-- Certificate summary card -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;
                          margin-bottom:28px;overflow:hidden">
              <!-- Coloured top stripe -->
              <tr><td style="height:4px;background:${color}"></td></tr>
              <tr>
                <td style="padding:24px;text-align:center">
                  <p style="color:#94a3b8;font-size:11px;letter-spacing:2px;
                             text-transform:uppercase;margin:0 0 6px">
                    Certificate Awarded For
                  </p>
                  <p style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 20px">
                    ${quizTitle}
                  </p>

                  <!-- Stats row -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="text-align:center;padding:12px 8px;background:#ffffff;
                                 border-radius:10px;border:1px solid #e2e8f0">
                        <p style="color:${color};font-size:30px;font-weight:800;margin:0;
                                   line-height:1">${scorePct != null ? scorePct + '%' : '—'}</p>
                        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;
                                   text-transform:uppercase;letter-spacing:1px">Score</p>
                      </td>
                      <td width="12"></td>
                      <td style="text-align:center;padding:12px 8px;background:#ffffff;
                                 border-radius:10px;border:1px solid #e2e8f0">
                        <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0;
                                   line-height:1.3">${date}</p>
                        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;
                                   text-transform:uppercase;letter-spacing:1px">Issued</p>
                      </td>
                      <td width="12"></td>
                      <td style="text-align:center;padding:12px 8px;background:#ffffff;
                                 border-radius:10px;border:1px solid #e2e8f0">
                        <p style="color:#334155;font-size:14px;font-weight:600;margin:0;
                                   font-family:monospace;line-height:1">#${sid}</p>
                        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;
                                   text-transform:uppercase;letter-spacing:1px">Cert ID</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Body text -->
            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 28px">
              Your certificate is ready to view and download from the QuizPlatform
              dashboard. You can print it or save it as a PDF directly from your browser.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center">
                  <a href="${certUrl}"
                     style="display:inline-block;background:${color};color:#ffffff;
                            text-decoration:none;padding:14px 36px;border-radius:12px;
                            font-weight:600;font-size:15px;letter-spacing:-0.2px">
                    View &amp; Download Certificate →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;text-align:center">
            <p style="color:#94a3b8;font-size:12px;margin:0">
              Issued by <strong style="color:#64748b">QuizPlatform</strong> &nbsp;·&nbsp;
              Certificate ID: <span style="font-family:monospace">#${sid}</span>
            </p>
            <p style="color:#cbd5e1;font-size:11px;margin:6px 0 0">
              This is an automated email. Please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Send a certificate notification email via Resend.
 * Fails silently (logs error, returns { ok: false }) — never throws.
 */
export async function sendCertificateEmail({ to, name, quizTitle, scorePct, certId, issuedAt, primaryColor }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping certificate email')
    return { ok: false, reason: 'no_api_key' }
  }

  const appUrl = (process.env.APP_URL || 'https://quiz-platform-mauve.vercel.app').replace(/\/$/, '')
  const from   = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  const html = buildHtml({ name, quizTitle, scorePct, certId, issuedAt, primaryColor, appUrl })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: `🎓 Your certificate for "${quizTitle}" is ready`,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[email] Resend API error:', res.status, errText)
      return { ok: false, reason: errText }
    }

    const data = await res.json()
    console.info('[email] Certificate email sent:', data.id, '→', to)
    return { ok: true, id: data.id }
  } catch (err) {
    console.error('[email] Unexpected error sending certificate email:', err)
    return { ok: false, reason: err?.message }
  }
}
