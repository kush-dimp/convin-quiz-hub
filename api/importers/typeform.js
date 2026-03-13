// Typeform Importer
export async function importTypeform(url) {
  try {
    // Extract form ID from URL
    let formId
    try {
      const match = url.match(/\/to\/([a-zA-Z0-9]+)/)
      formId = match ? match[1] : null
      if (!formId) throw new Error('Cannot extract form ID')
    } catch (err) {
      throw new Error('Invalid Typeform URL format')
    }

    // Fetch form data from Typeform public API (requires embed mode)
    // Typeform has rate limiting, so we'll fetch the public form page
    const formUrl = `https://form.typeform.com/to/${formId}`
    const res = await fetch(formUrl)
    if (!res.ok) throw new Error('Form not found')

    const html = await res.text()

    // Extract title from page
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1].split('|')[0].trim() : 'Imported from Typeform'

    // Extract questions from JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
    let questions = []

    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1])
        if (jsonLd.mainEntity && jsonLd.mainEntity.questions) {
          questions = jsonLd.mainEntity.questions.map(q => ({
            text: q.text || q.name || '',
            options: q.suggestedAnswer ? q.suggestedAnswer.map(a => a.text || a) : ['Yes', 'No'],
            correct_answer: 0,
            explanation: ''
          }))
        }
      } catch (e) {
        // Continue with fallback
      }
    }

    // Fallback: look for question text in page content
    if (questions.length === 0) {
      const questionPatterns = html.match(/"label":"([^"]+)"/g) || []
      questions = questionPatterns.map(p => {
        const textMatch = p.match(/"label":"([^"]+)"/)
        return {
          text: textMatch ? textMatch[1].trim() : '',
          options: ['Option 1', 'Option 2', 'Option 3'],
          correct_answer: 0,
          explanation: ''
        }
      }).filter(q => q.text)
    }

    if (questions.length === 0) {
      throw new Error('Could not extract questions from form')
    }

    if (questions.length > 100) {
      throw new Error('Form exceeds 100 questions limit')
    }

    return {
      title,
      description: 'Imported from Typeform',
      questions
    }
  } catch (err) {
    throw new Error(`Typeform import failed: ${err.message}`)
  }
}
