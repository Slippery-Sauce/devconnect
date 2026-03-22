import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { useNotifications } from '../hooks/useNotifications'
import Avatar from './Avatar'
import Drawer from './Drawer'
import BottomNav from './BottomNav'

const NAV_ITEMS = [
  { label: 'Home Feed',     path: '/home',     icon: '⌂' },
  { label: 'Project Space', path: '/projects', icon: '⬡', unread: true },
  { label: 'Requests',      path: '/requests', icon: '✉', badge: true },
  { label: 'Profile',       path: '/profile',  icon: '◎' },
  { label: 'Settings',      path: '/settings', icon: '⚙' },
]

function DesktopSidebar({ pendingCount, unreadProjects }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user     = useStore((s) => s.user)

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white text-lg shadow-md shadow-teal-500/30">⬡</div>
        <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">DevConnect</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active     = location.pathname.startsWith(item.path)
          const badgeCount = item.badge ? pendingCount : item.unread ? unreadProjects : 0
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150 group ${
                active
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}>
              <span className={`text-lg w-6 text-center transition-transform group-hover:scale-110 ${active ? 'text-teal-600' : ''}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <Avatar name={user?.name} size={36} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.email?.split('@')[0]}</p>
          </div>
        </button>
      </div>
    </aside>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [unreadProjects, setUnreadProjects] = useState(0)
  const { user, setRequests, requests }     = useStore()
  const location                            = useLocation()

  useNotifications()

  const checkUnread = useCallback(async () => {
    if (!user?.id) return
    const { data: myProjects } = await supabase
      .from('projects')
      .select('id')
      .contains('members', [user.id])

    if (!myProjects?.length) { setUnreadProjects(0); return }

    let unreadCount = 0
    for (const p of myProjects) {
      const lastSeen = localStorage.getItem(`last_seen_${p.id}_${user.id}`)
      const query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', p.id)
        .neq('sender_id', user.id)
      if (lastSeen) query.gt('created_at', lastSeen)
      const { count } = await query
      if (count > 0) unreadCount++
    }
    setUnreadProjects(unreadCount)
  }, [user?.id])

  // Recheck unread every time route changes
  useEffect(() => {
    checkUnread()
  }, [location.pathname, checkUnread])

  useEffect(() => {
    if (!user?.id) return

    supabase.from('requests').select('*').eq('owner_id', user.id)
      .then(({ data }) => setRequests(data || []))

    const reqChannel = supabase.channel(`layout-requests-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'requests',
        filter: `owner_id=eq.${user.id}`,
      }, () => {
        supabase.from('requests').select('*').eq('owner_id', user.id)
          .then(({ data }) => setRequests(data || []))
      })
      .subscribe()

    checkUnread()

    const msgChannel = supabase.channel(`layout-messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, (payload) => {
        if (payload.new.sender_id === user.id) return
        checkUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(reqChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [user?.id, checkUnread])

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <DesktopSidebar pendingCount={pendingCount} unreadProjects={unreadProjects} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pendingCount={pendingCount} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden pb-14 lg:pb-0">
          <Outlet context={{
            openDrawer:    () => setDrawerOpen(true),
            refreshUnread: checkUnread,
          }} />
        </div>
        <div className="lg:hidden">
          <BottomNav pendingCount={pendingCount} unreadProjects={unreadProjects} />
        </div>
      </div>
    </div>
  )
}