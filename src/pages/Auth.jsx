import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from '../hooks/useToast'

export default function Auth() {
  const navigate              = useNavigate()
  const [tab, setTab]         = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ name: '', email: '', password: '' })

  const updateForm = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'signup') {
        if (!form.name.trim()) { toast('Please enter your name', 'error'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({
          email:    form.email,
          password: form.password,
          options:  { data: { full_name: form.name } },
        })
        if (error) throw error
        navigate('/setup')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email:    form.email,
          password: form.password,
        })
        if (error) throw error
        // Check if profile is complete
        const { data: userData } = await supabase
          .from('users')
          .select('profile_complete')
          .eq('id', data.user.id)
          .single()
        navigate(userData?.profile_complete ? '/home' : '/setup')
      }
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options:  { redirectTo: `${window.location.origin}/home` },
      })
      if (error) throw error
    } catch (err) {
      toast(err.message, 'error')
      setLoading(false)
    }
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all`

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-teal-500/30">⬡</div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">DevConnect</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Find your perfect dev team</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 ${tab === k ? 'border-teal-500 text-teal-700 dark:text-teal-400 font-bold' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmail} className="px-6 pt-6 pb-5 space-y-3.5">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input value={form.name} onChange={updateForm('name')} placeholder="Alex Rivera" className={inputCls} required />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={updateForm('email')} placeholder="alex@example.com" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={form.password} onChange={updateForm('password')} placeholder="••••••••" className={inputCls} required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-md shadow-teal-500/30 mt-1">
              {loading ? 'Loading…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            </div>
            <button onClick={handleGoogle} disabled={loading}
              className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}