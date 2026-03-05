import { sql } from './_db.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    // GET /api/verify-email?token=...
    if (req.method === 'GET') {
      const { token } = req.query
      if (!token) {
        return res.status(400).json({ error: 'Token required' })
      }

      const rows = await sql`
        SELECT id, email_verified, verification_token_expires_at FROM profiles
        WHERE verification_token = ${token}
      `
      if (!rows.length) {
        return res.status(404).json({ error: 'Invalid or expired token' })
      }

      const user = rows[0]
      if (user.email_verified) {
        return res.status(200).json({ message: 'Email already verified' })
      }

      // Check if token expired
      if (new Date(user.verification_token_expires_at) < new Date()) {
        return res.status(400).json({ error: 'Token expired' })
      }

      // Mark as verified
      await sql`
        UPDATE profiles
        SET email_verified = true, verification_token = null, verification_token_expires_at = null
        WHERE id = ${user.id}
      `

      return res.status(200).json({ message: 'Email verified successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Verify email error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
