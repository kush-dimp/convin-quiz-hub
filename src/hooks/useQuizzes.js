import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'

/**
 * Fetch and manage quizzes.
 * @param {{ status?: string, instructorId?: string }} filters
 */
export function useQuizzes(filters = {}) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('quizzes')
        .select(`
          *,
          quiz_stats (*),
          profiles!quizzes_instructor_id_fkey (name)
        `)
        .order('created_at', { ascending: false })

      if (filters.status)       q = q.eq('status', filters.status)
      if (filters.instructorId) q = q.eq('instructor_id', filters.instructorId)

      const { data, error } = await q
      if (error) throw error
      setQuizzes(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.instructorId])

  useEffect(() => { fetch() }, [fetch])

  async function createQuiz(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('quizzes')
      .insert({ ...payload, instructor_id: user.id })
      .select()
      .single()
    if (!error) {
      setQuizzes(prev => [data, ...prev])
      await logAudit({ action: 'quiz.created', resource: data.title, severity: 'info' })
    }
    return { data, error }
  }

  async function updateQuiz(id, patch) {
    const { data, error } = await supabase
      .from('quizzes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q))
      await logAudit({ action: `quiz.updated`, resource: data.title, severity: 'info' })
    }
    return { data, error }
  }

  async function deleteQuiz(id) {
    const quiz = quizzes.find(q => q.id === id)
    const { error } = await supabase.from('quizzes').delete().eq('id', id)
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

  return { quizzes, loading, error, refetch: fetch, createQuiz, updateQuiz, deleteQuiz, publishQuiz, archiveQuiz }
}

/** Fetch a single quiz by ID (with questions). */
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
      const [quizRes, qRes] = await Promise.all([
        supabase.from('quizzes').select('*, quiz_stats(*)').eq('id', id).single(),
        supabase.from('questions').select('*').eq('quiz_id', id).order('position'),
      ])
      if (quizRes.error) setError(quizRes.error.message)
      else {
        setQuiz(quizRes.data)
        // Flatten payload fields into question objects for the editor
        setQuestions((qRes.data ?? []).map(deserializeQuestion))
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function saveQuestions(qs) {
    const rows = qs.map((q, i) => serializeQuestion(q, i, id))
    const { data, error } = await supabase
      .from('questions')
      .upsert(rows, { onConflict: 'id' })
      .select()
    if (!error) setQuestions((data ?? []).map(deserializeQuestion))
    return { data, error }
  }

  return { quiz, questions, loading, error, setQuiz, setQuestions, saveQuestions }
}
