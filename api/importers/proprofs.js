// ProProfs Quiz Importer
export async function importProProfs(url) {
  try {
    // Extract quiz ID from URL
    let quizId
    try {
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/([a-zA-Z0-9-]+)\//)
      const queryMatch = urlObj.searchParams.get('id') || urlObj.searchParams.get('title')
      quizId = pathMatch ? pathMatch[1] : queryMatch
      if (!quizId) throw new Error('Cannot extract quiz ID')
    } catch (err) {
      throw new Error('Invalid ProProfs URL format')
    }

    // Fetch quiz data from ProProfs API
    const apiUrl = `https://www.proprofs.com/api/v2/quiz/${quizId}`
    const apiRes = await fetch(apiUrl)
    if (!apiRes.ok) throw new Error('Quiz not found')
    const quizData = await apiRes.json()

    if (!quizData || !quizData.title) throw new Error('Invalid quiz data')

    const questions = quizData.questions || []
    if (questions.length === 0) throw new Error('Quiz has no questions')
    if (questions.length > 100) throw new Error('Quiz exceeds 100 questions limit')

    return {
      title: quizData.title,
      description: quizData.description || '',
      questions: questions.map(q => ({
        text: q.question || q.text || '',
        options: (q.options || []).map(opt => typeof opt === 'string' ? opt : opt.text || opt),
        correct_answer: q.correct_answer || 0,
        explanation: q.explanation || ''
      }))
    }
  } catch (err) {
    throw new Error(`ProProfs import failed: ${err.message}`)
  }
}
