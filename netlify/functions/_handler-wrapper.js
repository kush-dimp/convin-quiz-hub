/**
 * Wrapper to convert Vercel-style handlers to Netlify Functions
 * Netlify uses { statusCode, headers, body } format
 * Our handlers use Vercel's res.setHeader(), res.status(), res.json() format
 */

export function createNetlifyHandler(vercelHandler) {
  return async (event, context) => {
    // Build Vercel-style req object from Netlify event
    const req = {
      method: event.httpMethod,
      url: event.path + (event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''),
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : null,
      query: event.queryStringParameters || {},
    }

    // Build Vercel-style res object
    let statusCode = 200
    const headers = { 'Content-Type': 'application/json' }
    let body = null

    const res = {
      statusCode,
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
        body = data
        return res
      },
      end: () => {
        body = null
        return res
      },
    }

    // Call the Vercel-style handler
    await vercelHandler(req, res)

    // Return Netlify format
    return {
      statusCode,
      headers,
      body: body || '',
    }
  }
}
