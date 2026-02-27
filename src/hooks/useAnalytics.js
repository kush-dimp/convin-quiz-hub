import { useState, useEffect, useCallback } from 'react'

export function useAdminStats() {
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [lastSynced, setLastSynced] = useState(null)
  const [syncing,    setSyncing]    = useState(false)

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setSyncing(true)
    try {
      const data = await fetch('/api/analytics/admin-stats').then(r => r.json())
      setStats(data)
      setLastSynced(new Date())
    } catch {}
    finally {
      if (silent) setSyncing(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Silent auto-sync every 30s
  useEffect(() => {
    const id = setInterval(() => fetchStats(true), 30000)
    return () => clearInterval(id)
  }, [fetchStats])

  return { stats, loading, lastSynced, syncing, refetch: () => fetchStats(true) }
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
