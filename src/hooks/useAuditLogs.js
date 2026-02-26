import { useState, useEffect, useRef } from 'react'

export function useAuditLogs({ live = false } = {}) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  async function loadLogs() {
    try {
      const res  = await fetch('/api/audit')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('[audit-logs] fetch failed:', err.message)
    }
  }

  useEffect(() => {
    loadLogs().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!live) return
    // Poll every 30s instead of Realtime
    intervalRef.current = setInterval(loadLogs, 30000)
    return () => clearInterval(intervalRef.current)
  }, [live])

  return { logs, loading }
}
