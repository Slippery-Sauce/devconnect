import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { label: 'Feed',     path: '/home',     icon: '⌂' },
  { label: 'Projects', path: '/projects', icon: '⬡', badge: true },
  { label: 'Requests', path: '/requests', icon: '✉', badge: true },
  { label: 'Profile',  path: '/profile',  icon: '◎' },
]

export default function BottomNav({ pendingCount, unreadProjects }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex z-30">
      {TABS.map((tab) => {
        const active = location.pathname.startsWith(tab.path)
        const badgeCount = tab.path === '/requests' ? pendingCount : tab.path === '/projects' ? unreadProjects : 0
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center py-2 pb-3 gap-0.5 relative"
          >
            <span className="text-xl transition-colors duration-150"
              style={{ color: active ? '#10b981' : '#9ca3af' }}>
              {tab.icon}
            </span>
            <span className="text-[10px] font-medium transition-colors duration-150"
              style={{ color: active ? '#059669' : '#9ca3af', fontWeight: active ? 700 : 500 }}>
              {tab.label}
            </span>
            {badgeCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-14px)] bg-red-500 text-white text-[9px] font-bold rounded-full px-1 min-w-[16px] text-center leading-4">
                {badgeCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}