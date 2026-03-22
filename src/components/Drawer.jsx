import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Avatar from './Avatar'

const NAV_ITEMS = [
  { label: 'Home Feed',     path: '/home',     icon: '⌂' },
  { label: 'Project Space', path: '/projects', icon: '⬡' },
  { label: 'Requests',      path: '/requests', icon: '✉', badge: true },
  { label: 'Profile',       path: '/profile',  icon: '◎' },
  { label: 'Settings',      path: '/settings', icon: '⚙' },
]

export default function Drawer({ open, onClose, pendingCount }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const user       = useStore((s) => s.user)

  const go = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: open ? 'rgba(0,0,0,0.45)' : 'transparent',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 left-0 bottom-0 w-[270px] bg-white dark:bg-gray-900 z-50 flex flex-col shadow-2xl"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-base">
            ⬡
          </div>
          <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
            DevConnect
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium text-left transition-all duration-150 ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <Avatar name={user?.name} size={36} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              @{user?.email?.split('@')[0]}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
