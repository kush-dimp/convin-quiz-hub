import { sql } from './_db.js'
import { authenticateRequest } from './_middleware.js'

// Convert data array to CSV format
function generateCSV(headers, rows) {
  // Escape CSV values with quotes
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(','))
  ]
  return csvRows.join('\n')
}

// Generate simple HTML table that can be rendered as PDF
function generatePDFHTML(title, headers, rows) {
  const tableRows = rows
    .map(row =>
      `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #FF6B9D; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #FF6B9D; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .meta { font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="meta">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  try {
    // Authenticate user
    const auth = authenticateRequest(req, res)
    if (auth) return auth

    const { format, quizId } = req.query
    const isAdmin = ['super_admin', 'admin'].includes(req.user.role)
    const userId = req.user.id

    // Validate format parameter
    if (!format || !['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Format must be csv or pdf' })
    }

    // Build query to fetch quiz attempt data
    let query = `
      SELECT
        qa.id,
        qa.user_id,
        p.name as user_name,
        p.email as user_email,
        q.title as quiz_title,
        qa.score_pct as score,
        qa.score_pct >= q.passing_score_pct as passed,
        ROUND(EXTRACT(EPOCH FROM (qa.ended_at - qa.started_at))/60) as time_minutes,
        qa.created_at as attempt_date
      FROM quiz_attempts qa
      JOIN profiles p ON qa.user_id = p.id
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE 1=1
    `
    const params = []

    // Apply role-based filtering
    if (!isAdmin) {
      // Students can only see their own results
      params.push(userId)
      query += ` AND qa.user_id = $${params.length}`
    }

    // Apply quiz filter if specified
    if (quizId) {
      params.push(quizId)
      query += ` AND qa.quiz_id = $${params.length}`
    }

    query += ` ORDER BY qa.created_at DESC`

    // Execute query
    const rows = params.length > 0
      ? await sql(query, params)
      : await sql(query)

    // Return error if no data
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No report data available'
      })
    }

    // Prepare data for export
    const headers = [
      'User Name',
      'Email',
      'Quiz Title',
      'Score (%)',
      'Passed',
      'Time (minutes)',
      'Attempt Date'
    ]

    const exportData = rows.map(r => ({
      'User Name': r.user_name,
      'Email': r.user_email,
      'Quiz Title': r.quiz_title,
      'Score (%)': r.score ?? 'N/A',
      'Passed': r.passed ? 'Yes' : 'No',
      'Time (minutes)': r.time_minutes ?? 'N/A',
      'Attempt Date': new Date(r.attempt_date).toLocaleString()
    }))

    // Generate and return based on format
    if (format === 'csv') {
      const csv = generateCSV(headers, exportData)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="quiz-report.csv"')
      return res.status(200).send(csv)
    } else if (format === 'pdf') {
      // For PDF, we'll return HTML that can be printed/saved as PDF
      // In production, use a library like jsPDF or html2pdf
      const html = generatePDFHTML('Quiz Report', headers, exportData)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="quiz-report.html"')
      return res.status(200).send(html)
    }

  } catch (err) {
    console.error('Reports API Error:', err)
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message })
  }
}
