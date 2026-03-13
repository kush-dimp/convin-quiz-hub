import { sql } from './_db.js'
import { signToken, verifyToken } from './_jwt.js'
import { extractToken } from './_middleware.js'
// Fixed import path for Netlify (functions now in netlify/functions/ instead of api/)
import { sendUserInvite, sendVerificationEmail } from '../../lib/email.js'
import bcryptjs from 'bcryptjs'
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
    const sub = Array.isArray(req.query.sub) ? req.query.sub[0] : (req.query.sub || '')

    // GET /api/auth/me — verify JWT and return user
    if (sub === 'me' && req.method === 'GET') {
      const token = extractToken(req)
      if (!token) return res.status(401).json({ error: 'Unauthorized' })

      const payload = verifyToken(token)
      if (!payload) return res.status(401).json({ error: 'Invalid token' })

      const rows = await sql`SELECT id, name, email, role, email_verified FROM profiles WHERE id = ${payload.id}`
      if (!rows.length) return res.status(401).json({ error: 'User not found' })

      const user = rows[0]

      // Get permissions (may be updated since JWT was issued)
      const permRows = await sql`SELECT permission FROM role_permissions WHERE role = ${user.role}`
      const permissions = permRows.map(r => r.permission)

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          dashboard_access: payload.dashboard_access ?? true,
          permissions,
          email_verified: user.email_verified
        }
      })
    }

    // POST /api/auth/login — bcrypt verify → sign JWT → set cookie
    if (sub === 'login' && req.method === 'POST') {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
      }

      const rows = await sql`SELECT id, name, email, role, password_hash, email_verified FROM profiles WHERE email = ${email}`
      if (!rows.length) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const user = rows[0]
      if (!user.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const passwordMatch = await bcryptjs.compare(password, user.password_hash)
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Get dashboard access for this role
      const dashboardRows = await sql`SELECT dashboard_access FROM role_settings WHERE role = ${user.role}`
      const dashboard_access = dashboardRows.length ? dashboardRows[0].dashboard_access : true

      // Get permissions for this role
      const permRows = await sql`SELECT permission FROM role_permissions WHERE role = ${user.role}`
      const permissions = permRows.map(r => r.permission)

      const token = signToken({ id: user.id, email: user.email, role: user.role, dashboard_access, permissions })
      res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`)

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          dashboard_access,
          permissions,
          email_verified: user.email_verified
        }
      })
    }

    // POST /api/auth/logout — clear cookie
    if (sub === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')
      return res.status(200).json({ message: 'Logged out' })
    }

    // POST /api/auth/register — bcrypt hash → insert → sign JWT → set cookie
    if (sub === 'register' && req.method === 'POST') {
      const { email, password, name } = req.body
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name required' })
      }

      const existingRows = await sql`SELECT id FROM profiles WHERE email = ${email}`
      if (existingRows.length) {
        return res.status(409).json({ error: 'User already exists' })
      }

      const hashedPassword = await bcryptjs.hash(password, 12)
      const verificationToken = generateVerificationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      const newUserRows = await sql`
        INSERT INTO profiles (name, email, role, status, password_hash, verification_token, verification_token_expires_at)
        VALUES (${name}, ${email}, 'student', 'active', ${hashedPassword}, ${verificationToken}, ${expiresAt.toISOString()})
        RETURNING id, name, email, role, email_verified
      `
      const newUser = newUserRows[0]

      await sql`INSERT INTO profile_stats (user_id) VALUES (${newUser.id}) ON CONFLICT DO NOTHING`

      // Send verification email (async, don't wait)
      const verificationLink = getVerificationLink(verificationToken)
      sendUserInvite(email, name, verificationLink).then(result => {
        if (!result.ok) console.error('Failed to send verification email')
        else console.log('Verification email sent successfully')
      }).catch(err => console.error('Failed to send invite:', err))

      const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role })
      res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`)

      return res.status(201).json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          email_verified: newUser.email_verified
        }
      })
    }

    // GET /api/auth/verify-email?token=...
    if (sub === 'verify-email' && req.method === 'GET') {
      const { token } = req.query
      const tokenStr = Array.isArray(token) ? token[0] : (token || '')
      if (!tokenStr) {
        return res.status(400).json({ error: 'Token required' })
      }

      const rows = await sql`
        SELECT id, email_verified, verification_token_expires_at FROM profiles
        WHERE verification_token = ${tokenStr}
      `
      if (!rows.length) {
        return res.status(404).json({ error: 'Invalid or expired token' })
      }

      const user = rows[0]
      if (user.email_verified) {
        return res.status(200).json({ message: 'Email already verified' })
      }

      if (new Date(user.verification_token_expires_at) < new Date()) {
        return res.status(400).json({ error: 'Token expired' })
      }

      await sql`
        UPDATE profiles
        SET email_verified = true, verification_token = null, verification_token_expires_at = null
        WHERE id = ${user.id}
      `

      return res.status(200).json({ message: 'Email verified successfully' })
    }

    // POST /api/auth/resend-verification
    if (sub === 'resend-verification' && req.method === 'POST') {
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

      const verificationToken = generateVerificationToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await sql`
        UPDATE profiles
        SET verification_token = ${verificationToken}, verification_token_expires_at = ${expiresAt.toISOString()}
        WHERE id = ${user.id}
      `

      const verificationLink = getVerificationLink(verificationToken)
      sendVerificationEmail(email, user.name, verificationLink).then(result => {
        if (!result.ok) console.error('Failed to send verification email to', email)
        else console.log('Verification email sent to', email)
      }).catch(err =>
        console.error('Failed to send verification email:', err)
      )

      return res.status(200).json({ message: 'Verification email sent' })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('Auth API Error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
