import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    // Initial load
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setNotifications(data ?? [])
        setLoading(false)
      })

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => [payload.new, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function dismiss(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function dismissAllRead() {
    await supabase.from('notifications').delete().eq('user_id', userId).eq('read', true)
    setNotifications(prev => prev.filter(n => !n.read))
  }

  return { notifications, loading, unreadCount, markRead, markAllRead, dismiss, dismissAllRead }
}
