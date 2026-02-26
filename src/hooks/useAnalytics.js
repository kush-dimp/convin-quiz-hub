import { useState, useEffect } from 'react'

export function useAdminStats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/admin-stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { stats, loading }
}

export function useScoreDistribution(quizId) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = quizId ? `?quizId=${quizId}` : ''
    fetch(`/api/analytics/score-distribution${params}`)
      .then(r => r.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [quizId])

  return { data, loading }
}

export function usePerformanceOverTime(days = 30) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/performance?days=${days}`)
      .then(r => r.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [days])

  return { data, loading }
}

export function useQuestionPerformance(quizId) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = quizId ? `?quizId=${quizId}` : ''
    fetch(`/api/analytics/question-performance${params}`)
      .then(r => r.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [quizId])

  return { data, loading }
}

export function useSignupOverTime() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/signups')
      .then(r => r.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function usePopularQuizzes(limit = 5) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/popular-quizzes?limit=${limit}`)
      .then(r => r.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [limit])

  return { data, loading }
}
