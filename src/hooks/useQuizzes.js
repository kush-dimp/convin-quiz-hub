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
      const res  = await fetch(`/api/quizzes?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch quizzes')
      setQuizzes(data)
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
    const res  = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    const error = res.ok ? null : { message: data.error }
    if (!error) {
      setQuizzes(prev => [data, ...prev])
      await logAudit({ action: 'quiz.created', resource: data.title, severity: 'info' })
    }
    return { data: res.ok ? data : null, error }
  }

  async function updateQuiz(id, patch) {
    const res  = await fetch(`/api/quizzes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    const error = res.ok ? null : { message: data.error }
    if (!error) {
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q))
      await logAudit({ action: 'quiz.updated', resource: data.title, severity: 'info' })
    }
    return { data: res.ok ? data : null, error }
  }

  async function deleteQuiz(id) {
    const quiz = quizzes.find(q => q.id === id)
    const res  = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' })
    const error = res.ok ? null : { message: 'Failed to delete' }
    if (!error) {
      setQuizzes(prev => prev.filter(q => q.id !== id))
      await logAudit({ action: 'quiz.deleted', resource: quiz?.title, severity: 'warning' })
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
          fetch(`/api/quizzes/${id}`),
          fetch(`/api/quizzes/${id}/questions`),
        ])
        const quizData = await quizRes.json()
        const qData    = await qRes.json()
        if (!quizRes.ok) setError(quizData.error ?? 'Failed to load quiz')
        else {
          setQuiz(quizData)
          setQuestions((Array.isArray(qData) ? qData : []).map(deserializeQuestion))
        }
      } catch (err) {
        setError(err.message ?? 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function saveQuestions(qs) {
    const serialized = qs.map((q, i) => serializeQuestion(q, i, id))
    const res  = await fetch(`/api/quizzes/${id}/questions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serialized),
    })
    const data = await res.json()
    if (!res.ok) return { data: null, error: { message: data.error } }
    const sorted = (Array.isArray(data) ? data : []).sort((a, b) => a.position - b.position)
    setQuestions(sorted.map(deserializeQuestion))
    return { data: sorted, error: null }
  }

  return { quiz, questions, loading, error, setQuiz, setQuestions, saveQuestions }
}
