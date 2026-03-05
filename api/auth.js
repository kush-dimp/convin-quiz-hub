import { sql } from './_db.js'
import { signToken, verifyToken } from './_jwt.js'
import { extractToken } from './_middleware.js'
import { sendUserInvite, sendVerificationEmail } from '../lib/email.js'
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
      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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

      const token = signToken({ id: user.id, email: user.email, role: user.role })
      res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`)

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
      sendUserInvite(email, name, verificationLink).catch(err => console.error('Failed to send invite:', err))

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

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('Auth API Error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
