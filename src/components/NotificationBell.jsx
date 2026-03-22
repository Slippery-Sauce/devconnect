import { useRef, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { markAllRead, deleteNotification } from '../hooks/useNotifications'
import { timeAgo } from '../lib/utils'

const TYPE_ICON = {
  application: '📩',
  accepted:    '🎉',
  rejected:    '❌',
  message:     '💬',
  match:       '🤖',
  default:     '🔔',
}

export default function NotificationBell() {
  const { user, notifications } = useStore()
  const [open, setOpen]         = useState(false)
  const ref                     = useRef(null)

  const unread = notifications.filter((n) => !n.read).length

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen((o) => !o)
    if (!open && unread > 0) markAllRead(notifications, user?.uid)
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-xl text-gray-500 dark:text-gray-400">🔔</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Notifications</p>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  for (const n of notifications) await deleteNotification(n.id)
                }}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-3xl mb-2">🔕</span>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.read ? 'bg-teal-50/40 dark:bg-teal-950/30' : ''}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || TYPE_ICON.default}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-sm flex-shrink-0 mt-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}