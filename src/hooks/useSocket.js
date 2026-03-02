import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

/**
 * Manages a Socket.IO connection lifecycle.
 * @param {boolean} enabled - Set false to skip connecting (e.g. on unused pages)
 * @returns {{ socketRef: React.MutableRefObject, emit: Function }}
 */
export function useSocket(enabled = true) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const url = import.meta.env.VITE_SOCKET_URL || '/'
    const socket = io(url, { autoConnect: false })
    socketRef.current = socket
    socket.connect()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  return { socketRef, emit }
}
