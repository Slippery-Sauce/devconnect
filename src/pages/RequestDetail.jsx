import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { fetchMatchScore } from '../lib/claude'
import { scoreColor, timeAgo } from '../lib/utils'
import { createNotification } from '../hooks/useNotifications'
import { toast } from '../hooks/useToast'
import Topbar from '../components/Topbar'
import MatchBadge from '../components/MatchBadge'
import SkillTag from '../components/SkillTag'
import Avatar from '../components/Avatar'
import { SkeletonText } from '../components/Skeleton'

export default function RequestDetail() {
  const { id }   = useParams()
  const { user, matchCache, setMatchScore } = useStore()
  const [project, setProject]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [applied, setApplied]   = useState(false)
  const [applying, setApplying] = useState(false)
  const [message, setMessage]   = useState('')
  const [isDark, setIsDark]     = useState(false)
  const match = matchCache[id]

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(p)

      const { data: existing } = await supabase.from('requests')
        .select('id').eq('project_id', id).eq('applicant_id', user.id).single()
      setApplied(!!existing)

      if (!matchCache[id] && p) {
        const skills = user.skills?.length ? user.skills : ['React', 'TypeScript', 'Node.js']
        const result = await fetchMatchScore(skills, p.skills || [])
        setMatchScore(id, result)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const apply = async () => {
    setApplying(true)
    try {
      const { error } = await supabase.from('requests').insert({
        project_id:       id,
        project_title:    project.title,
        owner_id:         project.owner_id,
        applicant_id:     user.id,
        applicant_name:   user.name,
        applicant_skills: user.skills || [],
        message:          message.trim() || 'I would love to contribute to this project!',
        status:           'pending',
      })
      if (error) throw error

      await createNotification(project.owner_id, {
        title: 'New application! 📩',
        body:  `${user.name} applied to "${project.title}"`,
        type:  'application',
      })

      setApplied(true)
      toast('Application sent! ✨')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col flex-1">
      <Topbar title="" showBack />
      <div className="p-4 space-y-3">
        <SkeletonText w="3/4" h={6} />
        <SkeletonText w="full" h={4} />
        <SkeletonText w="2/3" h={4} />
      </div>
    </div>
  )

  if (!project) return (
    <div className="flex flex-col flex-1 items-center justify-center text-gray-400">
      <p>Project not found</p>
    </div>
  )

  const isOwner  = project.owner_id === user?.id
  const mc       = match?.score
  const colors   = mc != null ? scoreColor(mc) : null
  const inputCls = `w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="" showBack />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8">

        {/* Header */}
        <div>
          <span className="inline-block text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 rounded-full px-2.5 py-0.5 mb-1.5">
            {project.tags?.[0]}
          </span>
          <h1 className="text-lg font-black text-gray-900 dark:text-white leading-snug mb-1.5">
            {project.title}
          </h1>
          <div className="flex items-center gap-2">
            <Avatar name={project.owner_name} size={20} />
            <span className="text-xs text-gray-400">
              {project.owner_name} · {timeAgo(project.created_at)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {project.description}
        </p>

        {/* AI Match Score — reduced padding */}
        <div
          className="rounded-xl p-3 border dark:bg-gray-800 dark:border-gray-700"
          style={colors && !isDark
            ? { background: colors.bg, borderColor: colors.border }
            : undefined
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              Your AI Match Score
            </span>
            <MatchBadge score={mc} large />
          </div>
          {match?.reason && (
            <p
              className="text-xs leading-relaxed text-gray-700 dark:text-gray-200 mt-1.5"
              style={colors && !isDark ? { color: colors.text } : undefined}
            >
              {match.reason}
            </p>
          )}
          {!match && (
            <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse mt-1">
              Analysing skill compatibility…
            </p>
          )}
        </div>

        {/* Roles */}
        {project.roles_needed?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Roles Needed</h3>
            <div className="space-y-2">
              {project.roles_needed.map((r, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">{r.role}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.skills?.map((s) => <SkillTag key={s} skill={s} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Skills */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {project.skills?.map((s) => <SkillTag key={s} skill={s} />)}
          </div>
        </div>

        {/* Message input — reduced rows */}
        {!isOwner && !applied && (
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell them why you'd be a great fit…"
              rows={2}
              className={inputCls}
            />
          </div>
        )}

        {/* Apply button — reduced padding */}
        <button
          onClick={isOwner || applied ? undefined : apply}
          disabled={isOwner || applied || applying}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
            isOwner || applied
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white shadow-md shadow-teal-500/30'
          }`}
        >
          {isOwner
            ? 'This is your project'
            : applied
            ? '✓ Application Sent'
            : applying
            ? 'Sending…'
            : 'Apply to Contribute →'}
        </button>
      </div>
    </div>
  )
}