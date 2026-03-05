import { verifyToken } from './_jwt.js'

export function extractToken(req) {
  const cookie = req.headers.cookie || ''
  const match = cookie.split(';').find(c => c.trim().startsWith('auth_token='))
  if (!match) return null
  return match.split('=')[1]
}

export function authenticateRequest(req, res) {
  const token = extractToken(req)
  if (!token) {
    res.setHeader('Content-Type', 'application/json')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    res.setHeader('Content-Type', 'application/json')
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = payload
  return null
}
