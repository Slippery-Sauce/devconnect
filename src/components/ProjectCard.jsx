import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { toast } from '../hooks/useToast'
import MatchBadge from './MatchBadge'
import SkillTag from './SkillTag'
import Avatar from './Avatar'
import { timeAgo } from '../lib/utils'

export default function ProjectCard({ project, matchScore }) {
  const navigate  = useNavigate()
  const { user }  = useStore()
  const isOwner   = project.owner_id === user?.id

  const deletePost = async (e) => {
    e.stopPropagation() // prevent card click
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return
    try {
      await supabase.from('requests').delete().eq('project_id', project.id)
      await supabase.from('projects').delete().eq('id', project.id)
      toast('Project deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div
      onClick={() => navigate(`/home/${project.id}`)}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 cursor-pointer card-hover"
    >
      {/* Title + Match Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug flex-1">
          {project.title}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <MatchBadge score={matchScore?.score} />
          {/* Delete button — owner only */}
          {isOwner && (
            <button
              onClick={deletePost}
              className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950 text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:text-red-300 text-xs flex items-center justify-center transition-colors flex-shrink-0"
              title="Delete post"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">
        {project.description}
      </p>

      {/* Skill tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.skills.slice(0, 4).map((s) => (
          <SkillTag key={s} skill={s} />
        ))}
        {project.skills.length > 4 && (
          <span className="text-xs text-gray-400 self-center">
            +{project.skills.length - 4}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={project.owner_name} size={18} />
          <span className="text-[11px] text-gray-400">
            {project.owner_name} · {timeAgo(project.created_at)}
          </span>
        </div>
        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 rounded-full px-2 py-0.5">
          {project.tags?.[0]}
        </span>
      </div>
    </div>
  )
}