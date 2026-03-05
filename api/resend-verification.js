import { sql } from './_db.js'
import { sendVerificationEmail } from '../lib/email.js'
import crypto from 'crypto'

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex')
}

function getVerificationLink(token) {
  const appUrl = process.env.APP_URL || 'https://quiz-platform-mauve.vercel.app'
  return `${appUrl}/verify-email?token=${token}`
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    // POST /api/resend-verification
    if (req.method === 'POST') {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({ error: 'Email required' })
      }

      const rows = await sql`SELECT id, name, email_verified FROM profiles WHERE email = ${email}`
      if (!rows.length) {
        return res.status(404).json({ error: 'User not found' })
      }

      const user = rows[0]
      if (user.email_verified) {
        return res.status(200).json({ message: 'Email already verified' })
      }

      // Generate new token
      const verificationToken = generateVerificationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await sql`
        UPDATE profiles
        SET verification_token = ${verificationToken}, verification_token_expires_at = ${expiresAt.toISOString()}
        WHERE id = ${user.id}
      `

      // Send email (async)
      const verificationLink = getVerificationLink(verificationToken)
      sendVerificationEmail(email, user.name, verificationLink).catch(err =>
        console.error('Failed to send verification email:', err)
      )

      return res.status(200).json({ message: 'Verification email sent' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Resend verification error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
