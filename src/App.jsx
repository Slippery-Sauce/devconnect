import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store/useStore'
import { useToastProvider } from './hooks/useToast'

import Auth from './pages/Auth'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import RequestDetail from './pages/RequestDetail'
import Requests from './pages/Requests'
import Projects from './pages/Projects'
import ProjectGroup from './pages/ProjectGroup'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function ToastContainer() {
  const toasts = useToastProvider()
  const typeStyle = {
    success: 'bg-teal-500 text-white',
    error:   'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
  }
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[88%] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`${typeStyle[t.type] || typeStyle.success} px-4 py-3 rounded-xl text-sm font-semibold shadow-lg animate-slide-up`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

function AuthGuard({ children }) {
  const user = useStore((s) => s.user)
  if (user === undefined) return null
  if (!user) return <Navigate to="/" replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const user = useStore((s) => s.user)
  if (user === undefined) return null
  if (user) {
    if (user.profile_complete === false) return <Navigate to="/setup" replace />
    return <Navigate to="/home" replace />
  }
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-teal-500/30">
        ⬡
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { setUser, darkMode } = useStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  useEffect(() => {
    const loadUser = async (session) => {
      if (session?.user) {
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setUser(data ? { ...data } : {
            id:               session.user.id,
            email:            session.user.email,
            name:             session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            skills:           [],
            bio:              '',
            looking_for:      [],
            location:         '',
            profile_complete: false,
          })
        } catch {
          setUser({
            id:    session.user.id,
            email: session.user.email,
            name:  session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          })
        }
      } else {
        setUser(null)
      }
      setInitializing(false)
    }

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => loadUser(session))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show loading screen while restoring session on refresh
  if (initializing) return <LoadingScreen />

  return (
    <>
      <Routes>
        <Route path="/" element={<RedirectIfAuthed><Auth /></RedirectIfAuthed>} />
        <Route path="/setup" element={<AuthGuard><ProfileSetup /></AuthGuard>} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/home"         element={<Home />} />
          <Route path="/home/:id"     element={<RequestDetail />} />
          <Route path="/requests"     element={<Requests />} />
          <Route path="/projects"     element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectGroup />} />
          <Route path="/profile"      element={<Profile />} />
          <Route path="/settings"     element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}