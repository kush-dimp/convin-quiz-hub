// Google Forms Importer
export async function importGoogleForms(url) {
  try {
    // Extract form ID from URL
    let formId
    try {
      const match = url.match(/\/d\/e\/([a-zA-Z0-9-_]+)/) || url.match(/\/d\/([a-zA-Z0-9-_]+)/)
      formId = match ? match[1] : null
      if (!formId) throw new Error('Cannot extract form ID')
    } catch (err) {
      throw new Error('Invalid Google Forms URL format')
    }

    // Build prefilled URL to access form data
    const formUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`
    const res = await fetch(formUrl)
    if (!res.ok) throw new Error('Form not found')

    const html = await res.text()

    // Extract form title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(/\s+-\s+Google Forms\s*$/, '').trim() : 'Imported from Google Forms'

    // Extract questions from form data
    // Google Forms embeds question data in data attributes
    const questionsMatch = html.match(/\[\[\[\[\[\[null,null,\[\[(.*?)\]\]\]\]\]\]\]/s)

    if (!questionsMatch) {
      // Fallback: try simpler pattern matching for visible text
      const questionPatterns = html.match(/<div[^>]*data-item-id="[^"]*"[^>]*>/g) || []
      if (questionPatterns.length === 0) {
        throw new Error('No questions found in form')
      }
    }

    // Parse questions from HTML (simplified extraction)
    const questions = []
    const questionDivs = html.match(/<div[^>]*role="heading"[^>]*>([^<]+)<\/div>/g) || []

    for (let i = 0; i < questionDivs.length; i++) {
      const textMatch = questionDivs[i].match(/>([^<]+)</)
      if (textMatch) {
        questions.push({
          text: textMatch[1].trim(),
          options: ['Option 1', 'Option 2', 'Option 3'],
          correct_answer: 0,
          explanation: ''
        })
      }
    }

    if (questions.length === 0) {
      throw new Error('Could not extract questions from form. Form may require authentication.')
    }

    if (questions.length > 100) {
      throw new Error('Form exceeds 100 questions limit')
    }

    return {
      title,
      description: 'Imported from Google Forms',
      questions
    }
  } catch (err) {
    throw new Error(`Google Forms import failed: ${err.message}`)
  }
}
