import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, X, Clock, Award, AlertTriangle, Info, ClipboardList } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'

const typeConfig = {
  assignment:  { icon: ClipboardList, color: 'text-[#E63E6D]',  bg: 'bg-[#FFF5F7]'  },
  reminder:    { icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
  result:      { icon: Check,         color: 'text-emerald-600', bg: 'bg-emerald-50' },
  certificate: { icon: Award,         color: 'text-purple-600',  bg: 'bg-purple-50'  },
  overdue:     { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50'     },
  system:      { icon: Info,          color: 'text-slate-500',   bg: 'bg-slate-100'  },
}

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(isoStr).toLocaleDateString()
}

export default function NotificationBell() {
  const { profile } = useAuth()
  const { notifications, unreadCount, markRead, dismiss } = useNotifications(profile?.id)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get only recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Notifications List */}
          {recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {recentNotifications.map(notif => {
                const config = typeConfig[notif.type] || typeConfig.system
                const Icon = config.icon
                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {notif.title || notif.type}
                        </p>
                        {notif.message && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-start gap-1">
                        {!notif.read && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                          title="Dismiss"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 text-center">
              <a href="/notifications" className="text-xs font-medium text-[#FF6B9D] hover:text-[#E63E6D] transition-colors">
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
