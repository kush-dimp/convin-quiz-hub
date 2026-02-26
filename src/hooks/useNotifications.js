import { useState, useEffect, useRef } from 'react'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const intervalRef = useRef(null)

  async function loadNotifications() {
    if (!userId) return
    try {
      const params = new URLSearchParams({ userId })
      const res  = await fetch(`/api/notifications?${params}`)
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('[notifications] fetch failed:', err.message)
    }
  }

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    loadNotifications().then(() => setLoading(false))

    // Poll every 30s instead of Realtime
    intervalRef.current = setInterval(loadNotifications, 30000)
    return () => clearInterval(intervalRef.current)
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id) {
    await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    const params = new URLSearchParams({ userId })
    await fetch(`/api/notifications/bulk?${params}`, { method: 'PUT' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function dismiss(id) {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function dismissAllRead() {
    const params = new URLSearchParams({ userId })
    await fetch(`/api/notifications/bulk?${params}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => !n.read))
  }

  return { notifications, loading, unreadCount, markRead, markAllRead, dismiss, dismissAllRead }
}
