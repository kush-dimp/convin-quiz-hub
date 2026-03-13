// Generic URL Importer - tries to extract quiz data from any page
export async function importGeneric(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Page not found')

    const html = await res.text()

    // Try to extract title
    let title = 'Imported Quiz'
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    if (titleMatch) {
      title = titleMatch[1].split('|')[0].split('-')[0].trim()
    }

    // Try to extract questions from various patterns
    const questions = []

    // Pattern 1: Look for question-answer pairs in data attributes
    const qaPattern = html.match(/"question":\s*"([^"]+)"/g) || []
    if (qaPattern.length > 0) {
      qaPattern.forEach(q => {
        const textMatch = q.match(/"question":\s*"([^"]+)"/)
        if (textMatch) {
          questions.push({
            text: textMatch[1].trim(),
            options: ['Option 1', 'Option 2', 'Option 3'],
            correct_answer: 0,
            explanation: ''
          })
        }
      })
    }

    // Pattern 2: Look for h3/h4 tags as questions
    if (questions.length === 0) {
      const headingPattern = html.match(/<h[34][^>]*>([^<]+)<\/h[34]>/g) || []
      headingPattern.slice(0, 20).forEach(h => {
        const textMatch = h.match(/>([^<]+)</)
        if (textMatch && textMatch[1].trim().length > 10) {
          questions.push({
            text: textMatch[1].trim(),
            options: ['Option 1', 'Option 2', 'Option 3'],
            correct_answer: 0,
            explanation: ''
          })
        }
      })
    }

    // Pattern 3: Look for list items as options
    if (questions.length === 0) {
      const listPattern = html.match(/<li[^>]*>([^<]+)<\/li>/g) || []
      if (listPattern.length > 2) {
        questions.push({
          text: 'Question 1',
          options: listPattern.slice(0, 3).map(li => {
            const match = li.match(/>([^<]+)</)
            return match ? match[1].trim() : 'Option'
          }),
          correct_answer: 0,
          explanation: ''
        })
      }
    }

    if (questions.length === 0) {
      throw new Error('Could not extract quiz questions from page. URL may not contain structured quiz data.')
    }

    if (questions.length > 100) {
      throw new Error('Quiz exceeds 100 questions limit')
    }

    return {
      title,
      description: 'Imported from external URL',
      questions
    }
  } catch (err) {
    throw new Error(`Generic import failed: ${err.message}`)
  }
}
