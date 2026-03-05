// Email helper for user onboarding & verification via Nodemailer
import nodemailer from 'nodemailer'

const APP_URL = process.env.APP_URL || 'https://quiz-platform-mauve.vercel.app'

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function sendEmail(to, subject, htmlContent) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP credentials not set — skipping email')
    return { ok: false }
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: htmlContent,
    })

    console.log('[email] Email sent:', info.messageId, '→', to)
    return { ok: true }
  } catch (err) {
    console.error('[email] Send error:', err.message)
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
