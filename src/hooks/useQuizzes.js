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
      else { setQuiz(quizRes.data); setQuestions(qRes.data ?? []) }
      setLoading(false)
    }
    load()
  }, [id])

  async function saveQuestions(qs) {
    // Upsert all questions for this quiz
    const payload = qs.map((q, i) => ({
      ...q,
      quiz_id:  id,
      position: i,
      id:       q.id?.startsWith('new-') ? undefined : q.id,
    }))
    const { data, error } = await supabase
      .from('questions')
      .upsert(payload, { onConflict: 'id' })
      .select()
    if (!error) setQuestions(data ?? [])
    return { data, error }
  }

  return { quiz, questions, loading, error, setQuiz, setQuestions, saveQuestions }
}
