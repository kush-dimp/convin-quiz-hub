import { sql } from './_db.js'
import { authenticateRequest } from './_middleware.js'

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

    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'URL is required' })

    // Extract quiz ID from URL
    let quizId
    try {
      const urlObj = new URL(url)
      // ProProfs URLs like: https://www.proprofs.com/quiz-school/story.php?title=xyz
      // Quiz ID is typically the last numeric segment in the path or in query params
      const pathMatch = urlObj.pathname.match(/\/([a-zA-Z0-9-]+)\//)
      const queryMatch = urlObj.searchParams.get('id') || urlObj.searchParams.get('title')
      quizId = pathMatch ? pathMatch[1] : queryMatch

      if (!quizId) return res.status(400).json({ error: 'Invalid ProProfs URL format' })
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL: ' + err.message })
    }

    // Fetch quiz data from ProProfs API
    // ProProfs API endpoint: https://api.proprofs.com/v1/quizzes/{quizId}
    let quizData
    try {
      const apiUrl = `https://www.proprofs.com/api/v2/quiz/${quizId}`
      const apiRes = await fetch(apiUrl)
      if (!apiRes.ok) {
        return res.status(400).json({ error: 'Quiz not found or API error' })
      }
      quizData = await apiRes.json()
    } catch (err) {
      return res.status(400).json({ error: 'Failed to fetch quiz data: ' + err.message })
    }

    if (!quizData || !quizData.title) {
      return res.status(400).json({ error: 'Invalid quiz data received' })
    }

    // Extract and validate questions
    const questions = quizData.questions || []
    if (questions.length === 0) {
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
        ${quizData.time_limit || null},
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
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const options = (q.options || []).map(opt => typeof opt === 'string' ? opt : opt.text || opt)
      const correctIdx = q.correct_answer || 0

      await sql`
        INSERT INTO questions (
          quiz_id, position, type, text, points, explanation, payload, created_by
        ) VALUES (
          ${newQuiz.id},
          ${i},
          ${'multiple_choice'},
          ${q.question || q.text || ''},
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
      questionCount: questions.length
    })
  } catch (err) {
    console.error('ProProfs Import Error:', err)
    return res.status(500).json({ error: 'Server error: ' + (err.message || 'unknown') })
  }
}
