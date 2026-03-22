import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export function useNotifications() {
  const { user, setNotifications } = useStore()

  useEffect(() => {
    if (!user?.id) return

    // Initial fetch
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotifications(data || []))

    // Realtime
    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) =>
          prev.map((n) => n.id === payload.new.id ? payload.new : n)
        )
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])
}

export async function createNotification(userId, { title, body, type }) {
  await supabase.from('notifications').insert({
    user_id: userId, title, body, type, read: false,
  })
}

export async function markAllRead(notifications) {
  const unread = notifications.filter((n) => !n.read).map((n) => n.id)
  if (!unread.length) return
  await supabase.from('notifications').update({ read: true }).in('id', unread)
}

export async function deleteNotification(id) {
  await supabase.from('notifications').delete().eq('id', id)
}