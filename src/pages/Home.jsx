import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { fetchMatchScore } from '../lib/claude'
import { toast } from '../hooks/useToast'
import Topbar from '../components/Topbar'
import ProjectCard from '../components/ProjectCard'
import { SkeletonCard } from '../components/Skeleton'
import NotificationBell from '../components/NotificationBell'
import Avatar from '../components/Avatar'

const FILTERS = ['All', 'AI/ML', 'Web', 'Mobile', 'Open Source', 'Hackathon']

export default function Home() {
  const { openDrawer } = useOutletContext()
  const { user, projects, setProjects, matchCache, setMatchScore } = useStore()
  const [filter, setFilter]       = useState('All')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [posting, setPosting]     = useState(false)
  const [form, setForm]           = useState({ title: '', description: '', skills: '', tags: 'Web' })

  useEffect(() => {
    if (!user?.id) return

    // Only show listed + non-completed projects
    supabase
      .from('projects')
      .select('*')
      .eq('listed', true)
      .neq('status', 'Completed')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setProjects(data || [])
        setLoading(false)
      })

    const channel = supabase
      .channel('projects-feed')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'projects' },
        (payload) => {
          if (!payload.new.listed || payload.new.status === 'Completed') return
          setProjects((prev) => {
            if (prev.find((p) => p.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects' },
        (payload) => {
          // Remove from feed if unlisted or completed
          if (!payload.new.listed || payload.new.status === 'Completed') {
            setProjects((prev) => prev.filter((p) => p.id !== payload.new.id))
          } else {
            setProjects((prev) => prev.map((p) => p.id === payload.new.id ? payload.new : p))
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'projects' },
        (payload) => {
          setProjects((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  useEffect(() => {
    if (!user?.skills || projects.length === 0) return
    projects.forEach((p) => {
      if (matchCache[p.id] !== undefined) return
      const skills = user.skills?.length ? user.skills : ['React', 'TypeScript', 'Node.js']
      fetchMatchScore(skills, p.skills || []).then((result) => setMatchScore(p.id, result))
    })
  }, [projects])

  const filtered = filter === 'All' ? projects : projects.filter((p) => p.tags?.includes(filter))

  const postProject = async () => {
    if (!form.title.trim()) { toast('Please enter a project title', 'error'); return }
    setPosting(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { error } = await supabase.from('projects').insert({
        title:        form.title.trim(),
        description:  form.description.trim() || 'A new project looking for collaborators.',
        tags:         [form.tags],
        skills:       form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        roles_needed: [],
        owner_id:     authUser.id,
        owner_name:   user.name || authUser.email.split('@')[0],
        members:      [authUser.id],
        status:       'Open',
        listed:       true,
      })
      if (error) throw error
      setShowModal(false)
      setForm({ title: '', description: '', skills: '', tags: 'Web' })
      toast('Project posted! 🚀')
    } catch (err) {
      toast(err.message, 'error')
      console.error(err)
    } finally {
      setPosting(false)
    }
  }

  const inputCls = `w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="DevConnect" onMenuClick={openDrawer} trailing={
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="lg:hidden">
            <Avatar name={user?.name} size={28} />
          </div>
        </div>
      } />

      {/* Filter chips */}
      <div className="px-4 py-2.5 overflow-x-auto flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 w-max">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-150 ${
                filter === f
                  ? 'bg-teal-50 dark:bg-teal-950 border-teal-400 text-teal-800 dark:text-teal-300 font-bold'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">No projects yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== 'All'
                ? `No ${filter} projects found. Try another filter.`
                : 'Be the first to post a project!'}
            </p>
          </div>
        ) : (
          filtered.map((p) => (
            <ProjectCard key={p.id} project={p} matchScore={matchCache[p.id]} />
          ))
        )}
      </div>

      {/* FAB centered */}
      <div className="fixed bottom-16 lg:bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button
          onClick={() => setShowModal(true)}
          className="pointer-events-auto w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-2xl shadow-xl shadow-teal-500/40 flex items-center justify-center transition-all duration-150">
          +
        </button>
      </div>

      {/* Post modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-[480px] px-5 pb-10 pt-5 animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto mb-5" />
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5">Post a Project</h2>

            <div className="space-y-3.5">
              {[
                { key: 'title',       label: 'Project Title',                   ph: 'e.g. AI-powered code reviewer',                   multi: false },
                { key: 'description', label: 'Description',                     ph: 'What are you building and what help do you need?', multi: true  },
                { key: 'skills',      label: 'Skills Needed (comma-separated)', ph: 'React, Python, TypeScript…',                      multi: false },
              ].map(({ key, label, ph, multi }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    {label}
                  </label>
                  {multi
                    ? <textarea value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} rows={3} className={inputCls} />
                    : <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inputCls} />
                  }
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Category
                </label>
                <select value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className={inputCls}>
                  {['Web', 'Mobile', 'AI/ML', 'Open Source', 'Hackathon'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={postProject} disabled={posting}
              className="w-full mt-5 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-md shadow-teal-500/30">
              {posting ? 'Posting…' : 'Post Project →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}