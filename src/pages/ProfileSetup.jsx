import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { toast } from '../hooks/useToast'

const LOOKING_FOR = ['Hackathons', 'Short-term', 'Open source']
const STEPS = ['Welcome', 'About You', 'Your Skills', 'Looking For']
const SUGGESTED_SKILLS = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript',
  'Node.js', 'Python', 'Go', 'Rust', 'Java',
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  'PostgreSQL', 'MongoDB', 'Firebase', 'Supabase',
  'PyTorch', 'TensorFlow', 'LLMs', 'FastAPI',
  'Docker', 'Kubernetes', 'AWS', 'GCP',
  'Solidity', 'GraphQL', 'WebSockets', 'D3.js',
]

export default function ProfileSetup() {
  const navigate        = useNavigate()
  const { user, setUser } = useStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [form, setForm] = useState({
    name: user?.name || '', bio: '', location: '', skills: [], looking_for: [],
  })

  const toggleSkill = (skill) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }))

  const addCustomSkill = () => {
    const s = newSkill.trim()
    if (!s || form.skills.includes(s)) return
    setForm((f) => ({ ...f, skills: [...f.skills, s] }))
    setNewSkill('')
  }

  const toggleLookingFor = (opt) =>
    setForm((f) => ({
      ...f,
      looking_for: f.looking_for.includes(opt) ? f.looking_for.filter((x) => x !== opt) : [...f.looking_for, opt],
    }))

  const save = async () => {
    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Upsert user row
      const { error } = await supabase.from('users').upsert({
        id:               authUser.id,
        email:            authUser.email,
        name:             form.name,
        bio:              form.bio,
        location:         form.location,
        skills:           form.skills,
        looking_for:      form.looking_for,
        profile_complete: true,
      })
      if (error) throw error

      setUser({ ...user, ...form, id: authUser.id, profile_complete: true })
      toast('Profile set up! Welcome to DevConnect 🚀')
      navigate('/home')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all`

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                i < step ? 'bg-teal-500 text-white' : i === step ? 'bg-teal-500 text-white ring-4 ring-teal-500/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 rounded transition-all ${i < step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8">
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-teal-500/30">⬡</div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Welcome to DevConnect!</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">Let's set up your profile so we can match you with the right projects and teammates.</p>
              <div className="grid grid-cols-3 gap-3">
                {[{ icon: '🤖', label: 'AI matching' }, { icon: '🚀', label: 'Find projects' }, { icon: '👥', label: 'Build teams' }].map((f) => (
                  <div key={f.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xl mb-1">{f.icon}</p>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">About You</h2>
              <p className="text-sm text-gray-400 mb-6">Tell other developers who you are</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Alex Rivera" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Location</label>
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="San Francisco, CA" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Full stack dev passionate about AI and open source!" rows={3} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Your Skills</h2>
              <p className="text-sm text-gray-400 mb-4">Select all that apply — this powers your AI match score</p>
              <div className="flex gap-2 mb-4">
                <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()} placeholder="Add custom skill…" className={inputCls} />
                <button onClick={addCustomSkill} className="px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold flex-shrink-0 transition-colors">+</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                {[...SUGGESTED_SKILLS, ...form.skills.filter((s) => !SUGGESTED_SKILLS.includes(s))].map((skill) => {
                  const selected = form.skills.includes(skill)
                  return (
                    <button key={skill} onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selected ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-teal-400'}`}>
                      {selected ? '✓ ' : ''}{skill}
                    </button>
                  )
                })}
              </div>
              {form.skills.length > 0 && (
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-3">{form.skills.length} skill{form.skills.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">What are you looking for?</h2>
              <p className="text-sm text-gray-400 mb-6">We'll prioritise projects that match your goals</p>
              <div className="space-y-3">
                {[
                  { key: 'Hackathons',  icon: '⚡', desc: 'Short intense sprints, usually 24-48 hours' },
                  { key: 'Short-term',  icon: '📅', desc: 'Projects lasting a few weeks to months' },
                  { key: 'Open source', icon: '🌐', desc: 'Long-term open source contributions' },
                ].map((opt) => {
                  const active = form.looking_for.includes(opt.key)
                  return (
                    <button key={opt.key} onClick={() => toggleLookingFor(opt.key)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-teal-500 bg-teal-50 dark:bg-teal-950' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${active ? 'text-teal-800 dark:text-teal-300' : 'text-gray-800 dark:text-gray-200'}`}>{opt.key}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-teal-500 bg-teal-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {active && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !form.name.trim()}
                className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-md shadow-teal-500/30">
                Continue →
              </button>
            ) : (
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-md shadow-teal-500/30">
                {saving ? 'Setting up…' : 'Finish Setup 🚀'}
              </button>
            )}
          </div>
          {step > 0 && step < STEPS.length - 1 && (
            <button onClick={() => setStep((s) => s + 1)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">Skip for now</button>
          )}
        </div>
      </div>
    </div>
  )
}