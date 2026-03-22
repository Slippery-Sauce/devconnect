export const timeAgo = (ts) => {
  if (!ts) return ''
  const date = typeof ts === 'string' ? new Date(ts) : new Date(ts)
  const diff = Date.now() - date.getTime()
  if (diff < 60000)      return 'just now'
  if (diff < 3600000)    return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)   return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}d ago`
  return date.toLocaleDateString()
}

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#06b6d4',
]
export const getAvatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

export const scoreColor = (score) => {
  if (score >= 70) return { text: '#065f46', bg: '#d1fae5', border: '#6ee7b7', dot: '#10b981' }
  if (score >= 40) return { text: '#92400e', bg: '#fef3c7', border: '#fcd34d', dot: '#f59e0b' }
  return             { text: '#991b1b', bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' }
}