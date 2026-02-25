import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/** Admin-level stats for the dashboard header cards. */
export function useAdminStats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, quizzesRes, attemptsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('quiz_attempts')
          .select('score_pct, passed, submitted_at')
          .in('status', ['submitted', 'graded'])
          .gte('submitted_at', new Date(Date.now() - 86400000).toISOString()),
      ])

      const allAttempts = await supabase
        .from('quiz_attempts')
        .select('score_pct, passed')
        .in('status', ['submitted', 'graded'])

      const attempts    = allAttempts.data ?? []
      const avgScore    = attempts.length
        ? Math.round(attempts.reduce((s, r) => s + (r.score_pct ?? 0), 0) / attempts.length)
        : 0

      setStats({
        totalUsers:      usersRes.count  ?? 0,
        activeQuizzes:   quizzesRes.count ?? 0,
        quizzesToday:    attemptsRes.data?.length ?? 0,
        avgScore,
        serverStatus:    'healthy',
        apiResponseMs:   null,
        errorRatePct:    null,
      })
      setLoading(false)
    }
    load()
  }, [])

  return { stats, loading }
}

/** Score distribution for bar chart (10 buckets: 0-10, 10-20, …). */
export function useScoreDistribution(quizId) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      let q = supabase.from('quiz_attempts').select('score_pct').in('status', ['submitted','graded'])
      if (quizId) q = q.eq('quiz_id', quizId)
      const { data: rows } = await q

      const buckets = Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 10}–${(i + 1) * 10}`,
        count: 0,
      }))
      for (const r of rows ?? []) {
        const idx = Math.min(Math.floor((r.score_pct ?? 0) / 10), 9)
        buckets[idx].count++
      }
      setData(buckets)
      setLoading(false)
    }
    load()
  }, [quizId])

  return { data, loading }
}

/** Attempts and avg score over the last N days. */
export function usePerformanceOverTime(days = 30) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - days * 86400000).toISOString()
      const { data: rows } = await supabase
        .from('quiz_attempts')
        .select('score_pct, submitted_at')
        .in('status', ['submitted','graded'])
        .gte('submitted_at', since)
        .order('submitted_at')

      // Group by day
      const map = {}
      for (const r of rows ?? []) {
        const day = new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!map[day]) map[day] = { date: day, attempts: 0, totalScore: 0 }
        map[day].attempts++
        map[day].totalScore += r.score_pct ?? 0
      }
      const result = Object.values(map).map(d => ({
        date:     d.date,
        attempts: d.attempts,
        avgScore: Math.round(d.totalScore / d.attempts),
      }))
      setData(result)
      setLoading(false)
    }
    load()
  }, [days])

  return { data, loading }
}

/** Per-question performance stats (for QuestionAnalysis). */
export function useQuestionPerformance(quizId) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!quizId) { setLoading(false); return }
    async function load() {
      const { data: rows } = await supabase
        .from('attempt_answers')
        .select('question_id, is_correct, time_spent_s, questions(text, position, difficulty)')
        .eq('questions.quiz_id', quizId)

      // Group by question
      const map = {}
      for (const r of rows ?? []) {
        const qid = r.question_id
        if (!map[qid]) map[qid] = {
          id:         qid,
          text:       r.questions?.text       ?? '',
          difficulty: r.questions?.difficulty ?? 'Medium',
          correct:    0, total: 0, totalTime: 0,
        }
        map[qid].total++
        if (r.is_correct) map[qid].correct++
        map[qid].totalTime += r.time_spent_s ?? 0
      }
      const result = Object.values(map).map(q => ({
        ...q,
        avgTime: Math.round(q.totalTime / q.total),
        discriminationIndex: parseFloat(((q.correct / q.total) - 0.5).toFixed(2)),
      }))
      setData(result)
      setLoading(false)
    }
    load()
  }, [quizId])

  return { data, loading }
}

/** User signup counts by month (for AdminDashboard chart). */
export function useSignupOverTime() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at')

      const map = {}
      for (const r of rows ?? []) {
        const month = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short' })
        map[month] = (map[month] ?? 0) + 1
      }
      setData(Object.entries(map).map(([month, signups]) => ({ month, signups })))
      setLoading(false)
    }
    load()
  }, [])

  return { data, loading }
}

/** Most attempted quizzes. */
export function usePopularQuizzes(limit = 5) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, quizzes(title)')
        .in('status', ['submitted','graded'])

      const map = {}
      for (const r of rows ?? []) {
        const name = r.quizzes?.title ?? r.quiz_id
        map[name] = (map[name] ?? 0) + 1
      }
      const sorted = Object.entries(map)
        .map(([name, attempts]) => ({ name, attempts }))
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, limit)
      setData(sorted)
      setLoading(false)
    }
    load()
  }, [limit])

  return { data, loading }
}
