import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * List quiz attempts (results) with optional filters.
 * @param {{ quizId?: string, userId?: string, flagged?: boolean, limit?: number }} filters
 */
export function useResults(filters = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('quiz_attempts')
        .select(`
          *,
          profiles!quiz_attempts_user_id_fkey (name, email),
          quizzes!quiz_attempts_quiz_id_fkey (title)
        `)
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false })

      if (filters.quizId)  q = q.eq('quiz_id', filters.quizId)
      if (filters.userId)  q = q.eq('user_id',  filters.userId)
      if (filters.flagged) q = q.eq('flagged', true)
      if (filters.limit)   q = q.limit(filters.limit)

      const { data, error } = await q
      if (error) throw error

      // Normalise shape to match existing component expectations
      const normalised = (data ?? []).map(r => ({
        id:         r.id,
        userName:   r.profiles?.name  ?? 'Unknown',
        email:      r.profiles?.email ?? '',
        quizTitle:  r.quizzes?.title  ?? '',
        score:      Math.round(r.score_pct ?? 0),
        points:     r.points_earned  ?? 0,
        totalPoints:r.total_points   ?? 0,
        passed:     r.passed         ?? false,
        timeTaken:  formatTime(r.time_taken_s),
        timeMins:   Math.round((r.time_taken_s ?? 0) / 60),
        date:       r.submitted_at,
        attempt:    r.attempt_number,
        flagged:    r.flagged,
        tabSwitches:r.tab_switches,
        userId:     r.user_id,
        quizId:     r.quiz_id,
        _raw:       r,
      }))
      setResults(normalised)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.quizId, filters.userId, filters.flagged, filters.limit])

  useEffect(() => { fetch() }, [fetch])

  return { results, loading, error, refetch: fetch }
}

/** Single attempt detail including answers. */
export function useResult(attemptId) {
  const [attempt,  setAttempt]  = useState(null)
  const [answers,  setAnswers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!attemptId) { setLoading(false); return }
    async function load() {
      setLoading(true)
      const [aRes, ansRes] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('*, profiles(name,email), quizzes(title, passing_score_pct)')
          .eq('id', attemptId)
          .single(),
        supabase
          .from('attempt_answers')
          .select('*, questions(text, type, payload, points, explanation)')
          .eq('attempt_id', attemptId)
          .order('questions(position)'),
      ])
      if (aRes.error) setError(aRes.error.message)
      else { setAttempt(aRes.data); setAnswers(ansRes.data ?? []) }
      setLoading(false)
    }
    load()
  }, [attemptId])

  return { attempt, answers, loading, error }
}

/** Aggregate statistics across all submitted attempts. */
export function useResultStats(quizId) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      let q = supabase
        .from('quiz_attempts')
        .select('score_pct, passed, time_taken_s')
        .in('status', ['submitted', 'graded'])
      if (quizId) q = q.eq('quiz_id', quizId)

      const { data } = await q
      if (!data || data.length === 0) { setStats(null); setLoading(false); return }

      const total     = data.length
      const passed    = data.filter(r => r.passed).length
      const avgScore  = Math.round(data.reduce((s, r) => s + (r.score_pct ?? 0), 0) / total)
      const avgTime   = Math.round(data.reduce((s, r) => s + (r.time_taken_s ?? 0), 0) / total / 60)
      const passRate  = Math.round((passed / total) * 100)
      setStats({ total, passed, avgScore, avgTime, passRate })
      setLoading(false)
    }
    load()
  }, [quizId])

  return { stats, loading }
}

function formatTime(secs) {
  if (!secs) return '0m 0s'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}
