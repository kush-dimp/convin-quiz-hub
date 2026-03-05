// Email helper for user onboarding & verification via Resend API
const API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const APP_URL = process.env.APP_URL || 'https://quiz-platform-mauve.vercel.app'

export async function sendUserInvite(email, name, verificationLink) {
  if (!API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping user invite')
    return { ok: false }
  }

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

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
    })

    if (!res.ok) {
      console.error('[email] Resend error:', res.status)
      return { ok: false }
    }

    const data = await res.json()
    console.log('[email] User invite sent:', data.id, '→', email)
    return { ok: true, id: data.id }
  } catch (err) {
    console.error('[email] Send error:', err.message)
    return { ok: false }
  }
}

export async function sendVerificationEmail(email, name, verificationLink) {
  // Same as sendUserInvite for now
  return sendUserInvite(email, name, verificationLink)
}
