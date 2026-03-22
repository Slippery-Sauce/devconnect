import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { createNotification } from '../hooks/useNotifications'
import { fetchMatchScore } from '../lib/claude'
import { toast } from '../hooks/useToast'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import SkillTag from '../components/SkillTag'
import { timeAgo, getAvatarColor, getInitials } from '../lib/utils'

const STATUS_STYLE = {
  pending:  { text: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  accepted: { text: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  rejected: { text: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
}

function ApplicantProfileModal({ userId, applicantSkills, onClose }) {
  const [profile, setProfile]                     = useState(null)
  const [contributionCount, setContributionCount] = useState(0)
  const [applicationCount, setApplicationCount]   = useState(0)
  const [matchResult, setMatchResult]             = useState(null)
  const { user }                                  = useStore()

  useEffect(() => {
    supabase.from('users').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))

    supabase.from('projects').select('id', { count: 'exact' })
      .contains('members', [userId]).neq('owner_id', userId)
      .then(({ count }) => setContributionCount(count || 0))

    supabase.from('requests').select('id', { count: 'exact' })
      .eq('applicant_id', userId)
      .then(({ count }) => setApplicationCount(count || 0))

    if (applicantSkills?.length) {
      fetchMatchScore(
        applicantSkills,
        user.skills?.length ? user.skills : ['React', 'TypeScript']
      ).then((r) => setMatchResult(r))
    }
  }, [userId])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        {!profile ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-shimmer rounded h-6 w-32" />
          </div>
        ) : (
          <>
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center mb-5">
              {profile.avatar ? (
                <img src={profile.avatar} alt=""
                  className="w-16 h-16 rounded-full object-cover mb-3"
                  style={{ boxShadow: '0 0 0 3px #10b981' }} />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold mb-3"
                  style={{ background: getAvatarColor(profile.name), fontSize: 22, boxShadow: '0 0 0 3px #10b981' }}>
                  {getInitials(profile.name)}
                </div>
              )}
              <h3 className="text-base font-black text-gray-900 dark:text-white">{profile.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">@{profile.email?.split('@')[0]}</p>
              {profile.location && <p className="text-xs text-gray-400 mt-0.5">📍 {profile.location}</p>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                ['Contributions', contributionCount],
                ['Applications',  applicationCount],
                ['Match',         matchResult ? `${matchResult.score}%` : '…'],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">
                  <p className={`text-base font-black ${
                    l === 'Match' && matchResult
                      ? matchResult.score >= 70
                        ? 'text-teal-600 dark:text-teal-400'
                        : matchResult.score >= 40
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-500'
                      : 'text-gray-900 dark:text-white'
                  }`}>{v}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Match reason */}
            {matchResult?.reason && (
              <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-950 rounded-xl border border-teal-200 dark:border-teal-800">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300 mb-1">AI Match Insight</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 leading-relaxed">{matchResult.reason}</p>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => <SkillTag key={s} skill={s} />)}
                </div>
              </div>
            )}

            {/* Looking For */}
            {profile.looking_for?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Looking For</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.looking_for.map((opt) => (
                    <span key={opt} className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Requests() {
  const { openDrawer }        = useOutletContext()
  const { user, setRequests } = useStore()
  const [tab, setTab]         = useState('incoming')
  const [incoming, setIncoming]         = useState([])
  const [sent, setSent]                 = useState([])
  const [viewingProfile, setViewingProfile] = useState(null)

  const fetchIncoming = async () => {
    const { data } = await supabase
      .from('requests').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
    setIncoming(data || [])
    setRequests(data || [])
  }

  const fetchSent = async () => {
    const { data } = await supabase
      .from('requests').select('*').eq('applicant_id', user.id).order('created_at', { ascending: false })
    setSent(data || [])
  }

  useEffect(() => {
    if (!user?.id) return
    fetchIncoming()
    fetchSent()

    const channel = supabase.channel(`requests-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchIncoming()
        fetchSent()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const handleDecision = async (request, decision) => {
    try {
      const { error } = await supabase
        .from('requests').update({ status: decision }).eq('id', request.id)
      if (error) throw error

      if (decision === 'accepted') {
        const { data: project } = await supabase
          .from('projects').select('members').eq('id', request.project_id).single()
        const currentMembers = project?.members || []
        if (!currentMembers.includes(request.applicant_id)) {
          await supabase.from('projects')
            .update({ members: [...currentMembers, request.applicant_id] })
            .eq('id', request.project_id)
        }
        await createNotification(request.applicant_id, {
          title: 'Application accepted! 🎉',
          body:  `You've been accepted to "${request.project_title}"`,
          type:  'accepted',
        })
        toast('Application accepted! 🎉')
      } else {
        await createNotification(request.applicant_id, {
          title: 'Application update',
          body:  `Your application to "${request.project_title}" was not accepted this time.`,
          type:  'rejected',
        })
        toast('Application rejected', 'warning')
      }
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const deleteRequest = async (requestId) => {
    try {
      const { error } = await supabase.from('requests').delete().eq('id', requestId)
      if (error) throw error
      setIncoming((prev) => prev.filter((r) => r.id !== requestId))
      setRequests((prev) => Array.isArray(prev) ? prev.filter((r) => r.id !== requestId) : [])
      toast('Request deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const withdrawRequest = async (requestId) => {
    try {
      const { error } = await supabase.from('requests').delete().eq('id', requestId)
      if (error) throw error
      setSent((prev) => prev.filter((r) => r.id !== requestId))
      toast('Request withdrawn')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const StatusBadge = ({ status }) => {
    const s = STATUS_STYLE[status] || STATUS_STYLE.pending
    return (
      <span className="text-xs font-bold rounded-full px-2.5 py-0.5 border"
        style={{ color: s.text, background: s.bg, borderColor: s.border }}>
        {status.toUpperCase()}
      </span>
    )
  }

  const Empty = ({ icon, title, sub }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-base font-bold text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  )

  const pendingCount = incoming.filter((r) => r.status === 'pending').length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Requests" onMenuClick={openDrawer} />

      <div className="flex border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        {[['incoming', 'Incoming'], ['sent', 'Sent']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              tab === k
                ? 'border-teal-500 text-teal-700 dark:text-teal-400 font-bold'
                : 'border-transparent text-gray-500 dark:text-gray-400'
            }`}>
            {l}
            {k === 'incoming' && pendingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-6">
        {tab === 'incoming' && (
          incoming.length === 0
            ? <Empty icon="📭" title="No incoming requests" sub="Post a project to start receiving applications" />
            : incoming.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  {/* Clickable to view profile */}
                  <button
                    onClick={() => setViewingProfile({ id: r.applicant_id, skills: r.applicant_skills })}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                    <Avatar name={r.applicant_name} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                        {r.applicant_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">→ {r.project_title}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={r.status} />
                    <button onClick={() => deleteRequest(r.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100 text-xs flex items-center justify-center transition-colors"
                      title="Delete request">
                      🗑
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {r.applicant_skills?.map((s) => <SkillTag key={s} skill={s} />)}
                </div>

                {r.message && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    "{r.message}"
                  </p>
                )}

                <p className="text-[10px] text-gray-400 mb-3">{timeAgo(r.created_at)}</p>

                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(r, 'accepted')}
                      className="flex-1 py-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition-colors">
                      ✓ Accept
                    </button>
                    <button onClick={() => handleDecision(r, 'rejected')}
                      className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 transition-colors">
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))
        )}

        {tab === 'sent' && (
          sent.length === 0
            ? <Empty icon="📤" title="No applications sent" sub="Browse projects and apply to join a team" />
            : sent.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.project_title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.message && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3 truncate">"{r.message}"</p>
                )}
                {r.status === 'pending' && (
                  <button onClick={() => withdrawRequest(r.id)}
                    className="w-full mt-2 py-2 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition-colors">
                    Withdraw Request
                  </button>
                )}
              </div>
            ))
        )}
      </div>

      {/* Applicant profile modal */}
      {viewingProfile && (
        <ApplicantProfileModal
          userId={viewingProfile.id}
          applicantSkills={viewingProfile.skills}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </div>
  )
}