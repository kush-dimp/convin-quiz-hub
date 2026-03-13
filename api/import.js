import { sql } from './_db.js'
import { authenticateRequest } from './_middleware.js'
import { importProProfs } from './importers/proprofs.js'
import { importGoogleForms } from './importers/google-forms.js'
import { importTypeform } from './importers/typeform.js'
import { importGeneric } from './importers/generic.js'

const IMPORTERS = {
  proprofs: importProProfs,
  'google-forms': importGoogleForms,
  typeform: importTypeform,
  generic: importGeneric
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const auth = authenticateRequest(req, res)
    if (auth) return auth

    // Only admins can import
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can import quizzes' })
    }

    const { source, url } = req.body

    // Validate input
    if (!source) return res.status(400).json({ error: 'Source is required' })
    if (!url) return res.status(400).json({ error: 'URL is required' })
    if (!IMPORTERS[source]) return res.status(400).json({ error: 'Unsupported source' })

    // Get importer for source
    const importer = IMPORTERS[source]

    // Fetch and parse quiz data
    let quizData
    try {
      quizData = await importer(url)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }

    // Validate quiz data
    if (!quizData.title) return res.status(400).json({ error: 'Quiz has no title' })
    if (!quizData.questions || quizData.questions.length === 0) {
      return res.status(400).json({ error: 'Quiz has no questions' })
    }

    // Create quiz in database
    const quizRows = await sql`
      INSERT INTO quizzes (
        title, description, category, is_private, instructor_id,
        time_limit_mins, max_attempts, passing_score_pct,
        shuffle_questions, shuffle_options, show_results_immediately,
        show_correct_answers, allow_review, certificate_enabled
      ) VALUES (
        ${quizData.title},
        ${quizData.description || null},
        ${'imported'},
        ${false},
        ${req.user.id},
        ${null},
        ${null},
        ${70},
        ${false},
        ${false},
        ${true},
        ${true},
        ${true},
        ${false}
      )
      RETURNING *
    `

    const newQuiz = quizRows[0]

    // Create questions
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i]
      const options = q.options || []
      const correctIdx = q.correct_answer || 0

      await sql`
        INSERT INTO questions (
          quiz_id, position, type, text, points, explanation, payload, created_by
        ) VALUES (
          ${newQuiz.id},
          ${i},
          ${'multiple_choice'},
          ${q.text || ''},
          ${10},
          ${q.explanation || null},
          ${JSON.stringify({
            options,
            correct_answer: correctIdx
          })},
          ${req.user.id}
        )
      `
    }

    return res.status(201).json({
      success: true,
      message: 'Quiz imported successfully',
      quiz: newQuiz,
      questionCount: quizData.questions.length
    })
  } catch (err) {
    console.error('Import Error:', err)
    return res.status(500).json({ error: 'Server error: ' + (err.message || 'unknown') })
  }
}
