import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useAuditLogs({ live = false } = {}) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial load (most recent 200)
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!live) return

    const channel = supabase
      .channel('audit_logs_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        payload => setLogs(prev => [payload.new, ...prev].slice(0, 200))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [live])

  return { logs, loading }
}
