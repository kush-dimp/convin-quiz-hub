import { useState, useEffect, useCallback } from 'react'

export function useResults(filters = {}) {
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [lastSynced, setLastSynced] = useState(null)
  const [syncing,    setSyncing]    = useState(false)

  const fetchResults = useCallback(async (silent = false) => {
    if (silent) setSyncing(true)
    else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.quizId)  params.set('quizId',  filters.quizId)
      if (filters.userId)  params.set('userId',  filters.userId)
      if (filters.flagged) params.set('flagged', 'true')
      if (filters.limit)   params.set('limit',   filters.limit)
      const res  = await fetch(`/api/results?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch results')
      setResults(data)
      setLastSynced(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      if (silent) setSyncing(false)
      else setLoading(false)
    }
  }, [filters.quizId, filters.userId, filters.flagged, filters.limit])

  // Initial load
  useEffect(() => { fetchResults() }, [fetchResults])

  // Silent auto-sync every 30s
  useEffect(() => {
    const id = setInterval(() => fetchResults(true), 30000)
    return () => clearInterval(id)
  }, [fetchResults])

  return { results, loading, error, lastSynced, syncing, refetch: () => fetchResults(true) }
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
      const res  = await fetch(`/api/results/${attemptId}`)
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Failed to load result')
      else { setAttempt(data.attempt); setAnswers(data.answers ?? []) }
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
      const params = quizId ? `?quizId=${quizId}` : ''
      const res  = await fetch(`/api/results/stats${params}`)
      const data = await res.json()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [quizId])

  return { stats, loading }
}
