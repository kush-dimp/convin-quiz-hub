import { useState, useEffect, useCallback } from 'react'
import { logAudit } from '../lib/audit'

/**
 * Fetch and manage quizzes.
 * @param {{ status?: string, instructorId?: string }} filters
 */
export function useQuizzes(filters = {}) {
  const [quizzes,    setQuizzes]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [lastSynced, setLastSynced] = useState(null)
  const [syncing,    setSyncing]    = useState(false)

  const fetchQuizzes = useCallback(async (silent = false) => {
    if (silent) setSyncing(true)
    else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status)       params.set('status',       filters.status)
      if (filters.instructorId) params.set('instructorId', filters.instructorId)
      // Added credentials: 'include' to send auth tokens with fetch request
      const res = await fetch(`/api/quizzes?${params}`, { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to fetch quizzes')
      }
      const data = await res.json()
      setQuizzes(Array.isArray(data) ? data : [])
      setLastSynced(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      if (silent) setSyncing(false)
      else setLoading(false)
    }
  }, [filters.status, filters.instructorId])

  // Initial load
  useEffect(() => { fetchQuizzes() }, [fetchQuizzes])

  // Silent auto-sync every 30s
  useEffect(() => {
    const id = setInterval(() => fetchQuizzes(true), 30000)
    return () => clearInterval(id)
  }, [fetchQuizzes])

  async function createQuiz(payload) {
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        // FIX #1: Added credentials to include auth token/cookies in request
        // Without this, the backend's authenticateRequest middleware cannot verify the user
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // FIX #2: Capture response text BEFORE parsing, in case it's not JSON (e.g., HTML error page)
      const responseText = await res.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        // FIX #3: If response isn't JSON, log the actual response to help debug
        // This surfaces HTML error pages, plain text errors, or other non-JSON responses
        console.error('API returned non-JSON response:', {
          status: res.status,
          statusText: res.statusText,
          body: responseText.substring(0, 500),
        })
        data = {}
      }

      if (!res.ok) {
        // FIX #4: Log the real API error before returning generic message
        // This helps identify authentication failures (401), permission errors (403), etc.
        const errorMessage = data?.error || res.statusText || 'Unknown error'
        console.error('Quiz creation failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
          payload,
        })
        return { data: null, error: { message: data.error ?? 'Failed to create quiz' } }
      }

      setQuizzes(prev => [data, ...prev])
      await logAudit({ action: 'quiz.created', resource: data.title, severity: 'info' })
      return { data, error: null }
    } catch (err) {
      // FIX #5: Log network/parsing errors with full context
      // This captures timeouts, CORS errors, and other network failures
      console.error('Quiz creation error:', {
        message: err.message,
        stack: err.stack,
      })
      return { data: null, error: { message: err.message || 'Network error' } }
    }
  }

  async function updateQuiz(id, patch) {
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'PATCH',
        // Added credentials: 'include' to send auth tokens with update request
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const responseText = await res.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error('API returned non-JSON response for update:', {
          status: res.status,
          body: responseText.substring(0, 500),
        })
        data = {}
      }
      if (!res.ok) {
        console.error('Quiz update failed:', { status: res.status, error: data?.error })
        return { data: null, error: { message: data.error ?? 'Failed to update quiz' } }
      }
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q))
      await logAudit({ action: 'quiz.updated', resource: data.title, severity: 'info' })
      return { data, error: null }
    } catch (err) {
      console.error('Quiz update error:', err.message)
      return { data: null, error: { message: err.message } }
    }
  }

  async function deleteQuiz(id) {
    const quiz = quizzes.find(q => q.id === id)
    // Added credentials: 'include' to send auth tokens with delete request
    const res = await fetch(`/api/quizzes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const error = res.ok ? null : { message: 'Failed to delete' }
    if (!error) {
      setQuizzes(prev => prev.filter(q => q.id !== id))
      await logAudit({ action: 'quiz.deleted', resource: quiz?.title, severity: 'warning' })
    } else {
      console.error('Quiz delete failed:', { status: res.status, id })
    }
    return { error }
  }

  async function publishQuiz(id) {
    return updateQuiz(id, { status: 'published' })
      .then(r => {
        if (!r.error) logAudit({ action: 'quiz.published', resource: r.data?.title, severity: 'info' })
        return r
      })
  }

  async function archiveQuiz(id) {
    return updateQuiz(id, { status: 'archived' })
  }

  return { quizzes, loading, error, lastSynced, syncing, refetch: () => fetchQuizzes(true), createQuiz, updateQuiz, deleteQuiz, publishQuiz, archiveQuiz }
}

// DB columns that exist on the questions table
const Q_COLUMNS = new Set(['id','quiz_id','position','type','text','rich_text','points','difficulty','topic','explanation','time_limit_s','payload','created_by'])

// Flatten payload back into the question object for the editor
function deserializeQuestion(q) {
  return { ...q, ...(q.payload ?? {}) }
}

// Strip non-column fields into payload before saving to DB
function serializeQuestion(q, idx, quizId) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const row = { quiz_id: quizId, position: idx, payload: {} }
  if (uuidRe.test(q.id)) row.id = q.id
  for (const [k, v] of Object.entries(q)) {
    if (k === 'id' || k === 'payload') continue
    if (Q_COLUMNS.has(k)) row[k] = v
    else row.payload[k] = v
  }
  return row
}

export function useQuiz(id) {
  const [quiz,      setQuiz]      = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    if (!id || id === 'new') { setLoading(false); return }
    async function load() {
      setLoading(true)
      try {
        const [quizRes, qRes] = await Promise.all([
          // Added credentials: 'include' to send auth tokens with fetch
          fetch(`/api/quizzes/${id}`, { credentials: 'include' }),
          fetch(`/api/quizzes/${id}/questions`, { credentials: 'include' }),
        ])
        const quizData = await quizRes.json().catch(() => ({}))
        const qData    = await qRes.json().catch(() => [])
        if (!quizRes.ok) {
          setError(quizData.error ?? 'Failed to load quiz')
          return
        }
        setQuiz(quizData)
        setQuestions((Array.isArray(qData) ? qData : []).map(deserializeQuestion))
      } catch (err) {
        setError(err.message ?? 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function saveQuestions(qs) {
    try {
      const serialized = qs.map((q, i) => serializeQuestion(q, i, id))
      const res = await fetch(`/api/quizzes/${id}/questions`, {
        method: 'PUT',
        // Added credentials: 'include' to send auth tokens with save request
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serialized),
      })
      const responseText = await res.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error('API returned non-JSON response for saveQuestions:', {
          status: res.status,
          body: responseText.substring(0, 500),
        })
        data = []
      }
      if (!res.ok) {
        console.error('Save questions failed:', { status: res.status, error: data?.error })
        return { data: null, error: { message: data?.error ?? 'Failed to save questions' } }
      }
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => a.position - b.position)
      setQuestions(sorted.map(deserializeQuestion))
      return { data: sorted, error: null }
    } catch (err) {
      console.error('Save questions error:', err.message)
      return { data: null, error: { message: err.message } }
    }
  }

  return { quiz, questions, loading, error, setQuiz, setQuestions, saveQuestions }
}
