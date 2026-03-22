import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { toast } from '../hooks/useToast'
import { getAvatarColor, getInitials } from '../lib/utils'
import Topbar from '../components/Topbar'
import SkillTag from '../components/SkillTag'

const LOOKING_FOR = ['Hackathons', 'Short-term', 'Open source']

export default function Profile() {
  const { openDrawer }          = useOutletContext()
  const navigate                = useNavigate()
  const { user, setUser, matchCache } = useStore()
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profile, setProfile]   = useState({
    name: '', bio: '', location: '', skills: [], looking_for: [], avatar: null,
  })
  const [newSkill, setNewSkill] = useState('')
  const [sentCount, setSentCount]           = useState(0)
  const [contributionCount, setContributionCount] = useState(0)
  const photoRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile({
        name:       data.name || '',
        bio:        data.bio || '',
        location:   data.location || '',
        skills:     data.skills || [],
        looking_for: data.looking_for || [],
        avatar:     data.avatar || null,
      })
    })
    // Count applications sent
    supabase.from('requests').select('id', { count: 'exact' })
      .eq('applicant_id', user.id)
      .then(({ count }) => setSentCount(count || 0))
    // Count contributions — projects where user is member but not owner
    supabase.from('projects').select('id', { count: 'exact' })
      .contains('members', [user.id])
      .neq('owner_id', user.id)
      .then(({ count }) => setContributionCount(count || 0))
  }, [user?.id])

  const save = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('users').update({
        name:             profile.name,
        bio:              profile.bio,
        location:         profile.location,
        skills:           profile.skills,
        looking_for:      profile.looking_for,
        profile_complete: true,
      }).eq('id', user.id)
      if (error) throw error
      setUser({ ...user, ...profile, profile_complete: true })
      toast('Profile saved! ✓')
      setEditing(false)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Photo must be under 5MB', 'error'); return }
    if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return }
    setUploadingPhoto(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('project-files').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path)
      await supabase.from('users').update({ avatar: publicUrl }).eq('id', user.id)
      setProfile((p) => ({ ...p, avatar: publicUrl }))
      setUser({ ...user, avatar: publicUrl })
      toast('Profile photo updated! 📸')
    } catch (err) {
      toast('Failed to upload photo: ' + err.message, 'error')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const avgMatch = Object.values(matchCache).length > 0
    ? Math.round(Object.values(matchCache).reduce((a, b) => a + (b.score || 0), 0) / Object.values(matchCache).length)
    : null

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-teal-400 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 transition-all`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Profile" onMenuClick={openDrawer} trailing={
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/setup')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 transition-all hidden lg:block">
            Redo Setup
          </button>
          <button onClick={() => { if (editing) save(); else setEditing(true); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
              editing
                ? 'border-teal-400 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}>
            {saving ? 'Saving…' : editing ? 'Save' : 'Edit'}
          </button>
        </div>
      } />

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-8 space-y-6">

        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
                style={{ boxShadow: '0 0 0 4px #10b981' }} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: getAvatarColor(profile.name || user?.name), fontSize: 28, boxShadow: '0 0 0 4px #10b981' }}>
                {getInitials(profile.name || user?.name)}
              </div>
            )}
            <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center text-white text-xs shadow-md transition-colors disabled:opacity-60"
              title="Change photo">
              {uploadingPhoto ? '…' : '📷'}
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>

          {editing ? (
            <input value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className={`${inputCls} text-center font-bold text-lg mb-2 max-w-[240px]`} />
          ) : (
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{profile.name || user?.name}</h2>
          )}

          <p className="text-xs text-gray-400 mt-1">
            @{user?.email?.split('@')[0]}{profile.location && ` · ${profile.location}`}
          </p>

          {editing && (
            <input value={profile.location}
              onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
              placeholder="City, Country"
              className={`${inputCls} mt-2 text-center text-sm max-w-[220px]`} />
          )}
        </div>

        {/* Stats — now includes contributions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Applications', sentCount],
            ['Contributions', contributionCount],
            ['Avg Match',    avgMatch !== null ? `${avgMatch}%` : '—'],
            ['Skills',       profile.skills.length],
          ].map(([l, v]) => (
            <div key={l} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-gray-900 dark:text-white">{v}</p>
              <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{l}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Bio</h3>
          {editing ? (
            <textarea value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell other developers who you are…"
              rows={3} className={inputCls} />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {profile.bio || <span className="text-gray-400 italic">No bio yet — hit Edit to add one!</span>}
            </p>
          )}
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <SkillTag key={s} skill={s}
                onRemove={editing ? (sk) => setProfile((p) => ({ ...p, skills: p.skills.filter((x) => x !== sk) })) : null} />
            ))}
            {profile.skills.length === 0 && !editing && (
              <p className="text-sm text-gray-400 italic">No skills added yet</p>
            )}
          </div>
          {editing && (
            <div className="flex gap-2 mt-2.5">
              <input value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSkill.trim()) {
                    setProfile((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }))
                    setNewSkill('')
                  }
                }}
                placeholder="Add a skill…" className={inputCls} />
              <button onClick={() => {
                if (newSkill.trim()) {
                  setProfile((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }))
                  setNewSkill('')
                }
              }} className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold flex-shrink-0 transition-colors">
                +
              </button>
            </div>
          )}
        </div>

        {/* Looking For */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Looking For</h3>
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR.map((opt) => {
              const active = profile.looking_for.includes(opt)
              return (
                <button key={opt}
                  onClick={editing ? () => setProfile((p) => ({
                    ...p,
                    looking_for: p.looking_for.includes(opt)
                      ? p.looking_for.filter((x) => x !== opt)
                      : [...p.looking_for, opt],
                  })) : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-950 border-teal-400 text-teal-800 dark:text-teal-300 font-bold'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'
                  } ${editing ? 'cursor-pointer' : 'cursor-default'}`}>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        <button onClick={() => navigate('/setup')}
          className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors lg:hidden">
          Redo Setup
        </button>
      </div>
    </div>
  )
}