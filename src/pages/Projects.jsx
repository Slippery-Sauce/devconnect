import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import Topbar from '../components/Topbar'

const STATUS_STYLE = {
  'Open':        { text: '#065f46', bg: '#d1fae5' },
  'In Progress': { text: '#92400e', bg: '#fef3c7' },
  'Completed':   { text: '#3730a3', bg: '#e0e7ff' },
}

export default function Projects() {
  const { openDrawer, refreshUnread } = useOutletContext()
  const navigate                = useNavigate()
  const { user }                = useStore()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [unreadMap, setUnreadMap] = useState({})

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .contains('members', [user.id])
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const fetchUnread = async (projectList) => {
    if (!projectList?.length) return
    const map = {}
    for (const p of projectList) {
      const lastSeen = localStorage.getItem(`last_seen_${p.id}_${user.id}`)
      const query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', p.id)
        .neq('sender_id', user.id)
      if (lastSeen) query.gt('created_at', lastSeen)
      const { count } = await query
      map[p.id] = count > 0
    }
    setUnreadMap(map)
  }

  useEffect(() => {
    if (!user?.id) return
    fetchProjects()

    const channel = supabase.channel(`my-projects-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'projects'
      }, () => fetchProjects())
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, (payload) => {
        if (payload.new.sender_id === user.id) return
        setUnreadMap((prev) => ({ ...prev, [payload.new.project_id]: true }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  useEffect(() => {
    if (projects.length > 0) fetchUnread(projects)
  }, [projects])

  const handleOpenProject = (projectId) => {
    // Mark as read immediately
    localStorage.setItem(`last_seen_${projectId}_${user.id}`, new Date().toISOString())
    setUnreadMap((prev) => ({ ...prev, [projectId]: false }))
    // Tell Layout to recount unread badge
    if (refreshUnread) refreshUnread()
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Project Space" onMenuClick={openDrawer} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <div className="animate-shimmer rounded h-4 w-2/3 mb-2" />
              <div className="animate-shimmer rounded h-3 w-1/3" />
            </div>
          ))
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🚀</span>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">No projects yet</p>
            <p className="text-sm text-gray-400 mt-1">Post a project or apply to join one!</p>
          </div>
        ) : (
          projects.map((p) => {
            const isOwner   = p.owner_id === user?.id
            const status    = STATUS_STYLE[p.status] || STATUS_STYLE['Open']
            const hasUnread = unreadMap[p.id]
            return (
              <div key={p.id}
                onClick={() => handleOpenProject(p.id)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 cursor-pointer card-hover relative">
                {hasUnread && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-teal-500 rounded-full shadow-md shadow-teal-500/40" />
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug flex-1 pr-4">
                    {p.title}
                  </h3>
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0"
                    style={{ color: status.text, background: status.bg }}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    👥 {p.members?.length || 1} member{(p.members?.length || 1) !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {hasUnread && (
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 rounded-full px-2 py-0.5">
                        New messages
                      </span>
                    )}
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                      isOwner
                        ? 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950'
                        : 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                    }`}>
                      {isOwner ? 'Owner' : 'Contributor'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}