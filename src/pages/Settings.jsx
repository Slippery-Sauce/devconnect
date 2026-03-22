import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { toast } from '../hooks/useToast'
import Topbar from '../components/Topbar'
import Toggle from '../components/Toggle'

export default function Settings() {
  const { openDrawer }  = useOutletContext()
  const navigate        = useNavigate()
  const { notifSettings, toggleNotifSetting, privacy, togglePrivacy, setUser, darkMode, setDarkMode } = useStore()
  const [pwModal, setPwModal]         = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [pwForm, setPwForm]           = useState({ next: '', confirm: '' })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [pwLoading, setPwLoading]     = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/')
    toast('Logged out successfully')
  }

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { toast('Passwords do not match', 'error'); return }
    if (pwForm.next.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      toast('Password updated! 🔒')
      setPwModal(false)
      setPwForm({ next: '', confirm: '' })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { toast('Type DELETE to confirm', 'error'); return }
    setDeleteLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      await supabase.from('users').delete().eq('id', authUser.id)
      await supabase.auth.admin.deleteUser(authUser.id)
      await supabase.auth.signOut()
      setUser(null)
      navigate('/')
      toast('Account deleted')
    } catch (err) {
      // Fallback — sign out even if delete fails
      await supabase.auth.signOut()
      setUser(null)
      navigate('/')
    } finally {
      setDeleteLoading(false)
    }
  }

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all`

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{title}</h3>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
  )

  const Row = ({ label, sub, right }) => (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-200">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Settings" onMenuClick={openDrawer} />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <Section title="Appearance">
          <Row label="Dark Mode" sub="Switch between light and dark theme" right={<Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />} />
        </Section>

        <Section title="Notifications">
          <Row label="New match alerts"     sub="When a project matches your skills"           right={<Toggle on={notifSettings.newMatch}     onToggle={() => toggleNotifSetting('newMatch')} />} />
          <Row label="Group chat messages"  sub="New messages in your project groups"          right={<Toggle on={notifSettings.chat}         onToggle={() => toggleNotifSetting('chat')} />} />
          <Row label="Application updates" sub="When your applications are accepted/rejected"  right={<Toggle on={notifSettings.applications} onToggle={() => toggleNotifSetting('applications')} />} />
        </Section>

        <Section title="Privacy">
          <Row label="Public profile"     sub="Anyone can view your profile and skills" right={<Toggle on={privacy.publicProfile} onToggle={() => togglePrivacy('publicProfile')} />} />
          <Row label="Show online status" sub="Let others see when you're active"       right={<Toggle on={privacy.showOnline}    onToggle={() => togglePrivacy('showOnline')} />} />
        </Section>

        <Section title="Account">
          <Row label="Change password" right={<button onClick={() => setPwModal(true)} className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors">Change →</button>} />
          <div className="px-4 py-3 space-y-2">
            <button onClick={logout} className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Log Out</button>
            <button onClick={() => setDeleteModal(true)} className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900 transition-colors">Delete Account</button>
          </div>
        </Section>

        <p className="text-center text-xs text-gray-300 dark:text-gray-700 mt-2">DevConnect v0.1.0</p>
      </div>

      {/* Change password modal */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setPwModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-5">Change Password</h3>
            <div className="space-y-3 mb-5">
              {[['next','New Password','At least 6 characters'],['confirm','Confirm Password','Re-enter new password']].map(([key, label, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input type="password" value={pwForm[key]} onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inputCls} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPwModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={changePassword} disabled={pwLoading} className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-colors disabled:opacity-60">{pwLoading ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setDeleteModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="text-center mb-5">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-base font-black text-gray-900 dark:text-white mt-3">Delete Account</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">This is permanent. All your data will be deleted and cannot be recovered.</p>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Type DELETE to confirm</label>
              <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteLoading || deleteConfirm !== 'DELETE'} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">{deleteLoading ? 'Deleting…' : 'Delete Forever'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}