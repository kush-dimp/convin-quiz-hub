/**
 * Wrapper to convert Vercel-style handlers to Netlify Functions (callback format)
 * Netlify callback format: (event, context, callback) => callback(null, { statusCode, headers, body })
 * Our handlers use Vercel's res.setHeader(), res.status(), res.json() format
 */

export function createNetlifyHandler(vercelHandler) {
  return async (event, context) => {
    try {
      // Build Vercel-style req object from Netlify event
      let bodyData = null
      if (event.body) {
        try {
          bodyData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
        } catch (e) {
          bodyData = event.body
        }
      }

      const req = {
        method: event.httpMethod || 'GET',
        url: event.path || '/',
        headers: event.headers || {},
        body: bodyData,
        query: event.queryStringParameters || {},
      }

      // Build Vercel-style res object
      let statusCode = 200
      const headers = { 'Content-Type': 'application/json' }
      let body = ''

      const res = {
        setHeader: (key, value) => {
          headers[key] = value
        },
        status: (code) => {
          statusCode = code
          return res
        },
        json: (data) => {
          body = JSON.stringify(data)
          return res
        },
        send: (data) => {
          body = data instanceof String ? data : String(data)
          return res
        },
        end: () => {
          body = ''
          return res
        },
      }

      // Call the Vercel-style handler
      await vercelHandler(req, res)

      // Return Netlify callback format
      return {
        statusCode,
        headers,
        body: body || '',
      }
    } catch (error) {
      console.error('Handler error:', error)
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' }),
      }
    }
  }
}
