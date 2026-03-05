// Email helper for user onboarding & verification via Mailgun
const APP_URL = process.env.APP_URL || 'https://quiz-platform-mauve.vercel.app'
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'quiz-platform-mauve.vercel.app'
const FROM_EMAIL = process.env.FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`

console.log('[email] Mailgun Config:', {
  domain: MAILGUN_DOMAIN,
  apiKey: MAILGUN_API_KEY ? '***set***' : 'NOT SET',
  fromEmail: FROM_EMAIL,
})

async function sendEmail(to, subject, htmlContent) {
  console.log('[email] Attempting to send email to:', to)

  if (!MAILGUN_API_KEY) {
    console.error('[email] ❌ MAILGUN_API_KEY not set!')
    return { ok: false }
  }

  try {
    console.log('[email] Calling Mailgun API...')

    const formData = new URLSearchParams()
    formData.append('from', FROM_EMAIL)
    formData.append('to', to)
    formData.append('subject', subject)
    formData.append('html', htmlContent)

    const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')

    const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[email] ❌ Mailgun error:', data.message || data.error)
      return { ok: false }
    }

    console.log('[email] ✅ Email sent successfully:', data.id, '→', to)
    return { ok: true }
  } catch (err) {
    console.error('[email] ❌ Send error:', err.message)
    return { ok: false }
  }
}

export async function sendUserInvite(email, name, verificationLink) {
  const subject = 'Welcome to Convin Assess'
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #333;">
  <h2>Welcome to Convin Assess, ${name}!</h2>
  <p>Your account has been created successfully.</p>
  <p>Please verify your email to get started:</p>
  <p><a href="${verificationLink}" style="background: #FF6B9D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
  <p>Or visit: <a href="${verificationLink}">${verificationLink}</a></p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p>Questions? Login here: <a href="${APP_URL}/login">${APP_URL}/login</a></p>
</body>
</html>
  `
  return sendEmail(email, subject, html)
}

export async function sendVerificationEmail(email, name, verificationLink) {
  return sendUserInvite(email, name, verificationLink)
}
