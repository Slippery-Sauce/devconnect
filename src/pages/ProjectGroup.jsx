import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { createNotification } from '../hooks/useNotifications'
import { toast } from '../hooks/useToast'
import { timeAgo } from '../lib/utils'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'

function MemberName({ userId }) {
  const [name, setName] = useState('…')
  useEffect(() => {
    supabase.from('users').select('name, email').eq('id', userId).single()
      .then(({ data }) => {
        if (data) setName(data.name || data.email?.split('@')[0] || 'Unknown')
      })
  }, [userId])
  return <span>{name}</span>
}

function MembersTab({ project, user, onRemove }) {
  const [members, setMembers]         = useState([])
  const [ratings, setRatings]         = useState({})
  const [ratingModal, setRatingModal] = useState(null)
  const [score, setScore]             = useState(0)
  const [comment, setComment]         = useState('')
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    if (!project?.members?.length) return
    supabase.from('users').select('id, name, email, avatar')
      .in('id', project.members)
      .then(({ data }) => setMembers(data || []))

    supabase.from('ratings').select('*')
      .eq('project_id', project.id)
      .eq('rated_by_id', user.id)
      .then(({ data }) => {
        const map = {}
        data?.forEach((r) => { map[r.rated_user_id] = r })
        setRatings(map)
      })
  }, [project?.members?.join(',')])

  const submitRating = async () => {
    if (!score) { toast('Please select a score', 'error'); return }
    setSubmitting(true)
    try {
      const existing = ratings[ratingModal.userId]
      if (existing) {
        await supabase.from('ratings')
          .update({ score, comment })
          .eq('id', existing.id)
      } else {
        await supabase.from('ratings').insert({
          project_id:    project.id,
          rated_user_id: ratingModal.userId,
          rated_by_id:   user.id,
          score,
          comment,
        })
      }
      setRatings((prev) => ({
        ...prev,
        [ratingModal.userId]: { rated_user_id: ratingModal.userId, score, comment }
      }))
      toast('Rating submitted! ⭐')
      setRatingModal(null)
      setScore(0)
      setComment('')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const isOwner = project.owner_id === user?.id

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-gray-100 dark:divide-gray-800">
      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
          <span className="text-3xl mb-2">👥</span>
          <p className="text-sm">No members yet</p>
        </div>
      )}

      {members.map((m) => {
        const isProjectOwner = m.id === project.owner_id
        const displayName    = m.name || m.email?.split('@')[0] || 'Member'
        const myRating       = ratings[m.id]
        const canRate        = m.id !== user?.id

        return (
          <div key={m.id} className="py-3.5">
            <div className="flex items-center gap-3">
              {m.avatar ? (
                <img src={m.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <Avatar name={displayName} size={40} />
              )}

              <div className="flex-1 min-w-0">
                {/* Name row with inline star */}
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                  {canRate && (
                    <button
                      onClick={() => {
                        setRatingModal({ userId: m.id, name: displayName })
                        setScore(myRating?.score || 0)
                        setComment(myRating?.comment || '')
                      }}
                      className="flex-shrink-0 transition-transform hover:scale-125 active:scale-110"
                      title={myRating ? `Your rating: ${myRating.score}/5 — click to edit` : 'Rate this member'}
                    >
                      <span className={`text-base leading-none ${
                        myRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                      }`}>
                        ★
                      </span>
                    </button>
                  )}
                </div>
                {m.id === user?.id && <p className="text-xs text-gray-400">You</p>}
                {/* Show stars if already rated */}
                {myRating && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-[10px] ${i < myRating.score ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                  isProjectOwner
                    ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950'
                    : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950'
                }`}>
                  {isProjectOwner ? 'Owner' : 'Contributor'}
                </span>
                {isOwner && !isProjectOwner && (
                  <button onClick={() => onRemove(m.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setRatingModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
              Rate {ratingModal.name}
            </h3>
            <p className="text-xs text-gray-400 mb-5">How well did they contribute to this project?</p>

            {/* 5 star selector */}
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setScore(s)}
                  className={`text-5xl transition-all hover:scale-110 active:scale-95 ${
                    s <= score ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 dark:text-gray-600'
                  }`}>
                  ★
                </button>
              ))}
            </div>

            {score > 0 && (
              <p className="text-center text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">
                {['', '😕 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🤩 Excellent!'][score]}
              </p>
            )}

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 transition-all mb-4"
            />

            <div className="flex gap-2">
              <button onClick={() => setRatingModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={submitRating} disabled={submitting || !score}
                className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {submitting ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectGroup() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useStore()
  const [project, setProject]               = useState(null)
  const [tab, setTab]                       = useState('chat')
  const [messages, setMessages]             = useState([])
  const [tasks, setTasks]                   = useState([])
  const [files, setFiles]                   = useState([])
  const [msgText, setMsgText]               = useState('')
  const [newTask, setNewTask]               = useState('')
  const [uploading, setUploading]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [completing, setCompleting]         = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal]     = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const endRef       = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user?.id || !id) return
    localStorage.setItem(`last_seen_${id}_${user.id}`, new Date().toISOString())
  }, [id, user?.id])

  useEffect(() => {
    supabase.from('projects').select('*').eq('id', id).single()
      .then(({ data }) => setProject(data))

    fetchMessages()
    fetchTasks()
    fetchFiles()

    const chatChannel = supabase.channel(`chat-${id}`, {
      config: { broadcast: { self: false } }
    })
      .on('broadcast', { event: 'new-message' }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.payload.id)) return prev
          return [...prev, payload.payload]
        })
        localStorage.setItem(`last_seen_${id}_${user.id}`, new Date().toISOString())
      })
      .on('broadcast', { event: 'task-added' }, (payload) => {
        setTasks((prev) => {
          if (prev.find((t) => t.id === payload.payload.id)) return prev
          return [...prev, payload.payload]
        })
      })
      .on('broadcast', { event: 'task-moved' }, (payload) => {
        setTasks((prev) => prev.map((t) => t.id === payload.payload.id ? payload.payload : t))
      })
      .on('broadcast', { event: 'task-deleted' }, (payload) => {
        setTasks((prev) => prev.filter((t) => t.id !== payload.payload.id))
      })
      .subscribe()

    const dbChannel = supabase.channel(`db-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'files'
      }, (payload) => {
        if (payload.new.project_id !== id) return
        setFiles((prev) => {
          if (prev.find((f) => f.id === payload.new.id)) return prev
          return [payload.new, ...prev]
        })
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'files'
      }, (payload) => {
        if (payload.old.project_id !== id) return
        setFiles((prev) => prev.filter((f) => f.id !== payload.old.id))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'projects'
      }, (payload) => {
        if (payload.new.id !== id) return
        setProject(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(dbChannel)
    }
  }, [id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages').select('*').eq('project_id', id).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true })
    setTasks(data || [])
  }

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('files').select('*').eq('project_id', id).order('created_at', { ascending: false })
    setFiles(data || [])
  }

  const sendMessage = async () => {
    if (!msgText.trim()) return
    const text = msgText.trim()
    setMsgText('')

    const tempMsg = {
      id:          `temp-${Date.now()}`,
      project_id:  id,
      sender_id:   user.id,
      sender_name: user.name,
      text,
      created_at:  new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({ project_id: id, sender_id: user.id, sender_name: user.name, text })
      .select().single()

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      toast('Failed to send message', 'error')
      setMsgText(text)
      return
    }

    setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? data : m))
    localStorage.setItem(`last_seen_${id}_${user.id}`, new Date().toISOString())

    await supabase.channel(`chat-${id}`).send({
      type: 'broadcast', event: 'new-message', payload: data,
    })
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    const title = newTask.trim()
    setNewTask('')

    const tempTask = {
      id:         `temp-${Date.now()}`,
      project_id: id,
      title,
      status:     'todo',
      created_by: user.id,
      created_at: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, tempTask])

    const { data, error } = await supabase
      .from('tasks')
      .insert({ project_id: id, title, status: 'todo', created_by: user.id })
      .select().single()

    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempTask.id))
      toast('Failed to add task', 'error')
      setNewTask(title)
      return
    }

    setTasks((prev) => prev.map((t) => t.id === tempTask.id ? data : t))

    await supabase.channel(`chat-${id}`).send({
      type: 'broadcast', event: 'task-added', payload: data,
    })
  }

  const moveTask = async (taskId) => {
    const updatedTask = {
      ...tasks.find((t) => t.id === taskId),
      status:       'done',
      completed_by: user.id,
    }
    setTasks((prev) => prev.map((t) => t.id === taskId ? updatedTask : t))

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_by: user.id })
      .eq('id', taskId)
      .select().single()

    if (error) { toast('Failed to update task', 'error'); fetchTasks(); return }

    await supabase.channel(`chat-${id}`).send({
      type: 'broadcast', event: 'task-moved', payload: data,
    })
  }

  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) { toast('Failed to delete task', 'error'); fetchTasks(); return }

    await supabase.channel(`chat-${id}`).send({
      type: 'broadcast', event: 'task-deleted', payload: { id: taskId },
    })
  }

  const removeMember = async (memberId) => {
    if (project.owner_id === memberId) { toast("Can't remove the owner", 'error'); return }
    const members = project.members.filter((m) => m !== memberId)
    await supabase.from('projects').update({ members }).eq('id', id)
    setProject((p) => ({ ...p, members }))
    toast('Member removed')
  }

  const completeProject = async () => {
    setCompleting(true)
    try {
      await supabase.from('projects')
        .update({ status: 'Completed', members: [], listed: false })
        .eq('id', id)
      const nonOwnerMembers = (project.members || []).filter((m) => m !== project.owner_id)
      for (const memberId of nonOwnerMembers) {
        await createNotification(memberId, {
          title: 'Project completed! 🎉',
          body:  `"${project.title}" has been marked as completed.`,
          type:  'match',
        })
      }
      toast('Project marked as completed! 🎉')
      setShowCompleteModal(false)
      navigate('/projects')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setCompleting(false)
    }
  }

  const deleteProject = async () => {
    setDeleting(true)
    try {
      const nonOwnerMembers = (project.members || []).filter((m) => m !== project.owner_id)
      for (const memberId of nonOwnerMembers) {
        await createNotification(memberId, {
          title: 'Project deleted',
          body:  `"${project.title}" has been deleted by the owner.`,
          type:  'rejected',
        })
      }
      await supabase.from('messages').delete().eq('project_id', id)
      await supabase.from('tasks').delete().eq('project_id', id)
      await supabase.from('files').delete().eq('project_id', id)
      await supabase.from('requests').delete().eq('project_id', id)
      await supabase.from('projects').delete().eq('id', id)
      toast('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast('File must be under 20MB', 'error'); return }
    uploadFile(file)
    e.target.value = ''
  }

  const uploadFile = async (file) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const path = `${id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('project-files').upload(path, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('project-files').getPublicUrl(path)
      await supabase.from('files').insert({
        project_id: id, name: file.name, size: file.size, type: file.type,
        url: publicUrl, storage_path: path, uploaded_by: user.id, uploader_name: user.name,
      })
      toast('File uploaded! 📎')
    } catch (err) {
      toast('Upload failed: ' + err.message, 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteFile = async (file) => {
    try {
      await supabase.storage.from('project-files').remove([file.storage_path])
      await supabase.from('files').delete().eq('id', file.id)
      toast('File deleted')
    } catch { toast('Failed to delete file', 'error') }
  }

  const formatBytes = (b) =>
    b < 1024 ? b + ' B' : b < 1048576
      ? (b / 1024).toFixed(1) + ' KB'
      : (b / 1048576).toFixed(1) + ' MB'

  const fileIcon = (t) =>
    t?.startsWith('image/') ? '🖼️' :
    t?.startsWith('video/') ? '🎬' :
    t?.includes('pdf')      ? '📄' :
    t?.includes('zip')      ? '🗜️' :
    t?.includes('sheet') || t?.includes('csv') ? '📊' :
    t?.includes('word')     ? '📝' : '📎'

  if (!project) return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div className="animate-shimmer rounded h-6 w-48" />
    </div>
  )

  const isOwner  = project.owner_id === user?.id
  const inputCls = `flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-teal-500 transition-all`

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title={project.title.length > 26 ? project.title.slice(0, 26) + '…' : project.title}
        showBack
        trailing={
          isOwner && project.status !== 'Completed' ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCompleteModal(true)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 hover:bg-teal-100 transition-colors">
                ✓ Complete
              </button>
              <button onClick={() => setShowDeleteModal(true)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors">
                🗑
              </button>
            </div>
          ) : project.status === 'Completed' ? (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Completed
            </span>
          ) : null
        }
      />

      <div className="flex border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
        {[['chat','💬 Chat'],['tasks','✓ Tasks'],['members','👥 Team'],['files','📁 Files']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all ${
              tab === k
                ? 'border-teal-500 text-teal-700 dark:text-teal-400 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {l}
            {k === 'files' && files.length > 0 && (
              <span className="ml-1 text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full px-1.5 py-0.5">
                {files.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chat */}
      {tab === 'chat' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                <span className="text-4xl mb-3">💬</span>
                <p className="text-sm font-medium">Start the conversation!</p>
              </div>
            )}
            {messages.map((m) => {
              const mine   = m.sender_id === user?.id
              const isTemp = m.id?.startsWith('temp-')
              return (
                <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <Avatar name={m.sender_name} size={28} />
                  <div className={`max-w-[75%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <p className={`text-[10px] text-gray-400 mb-1 ${mine ? 'text-right' : ''}`}>
                      {m.sender_name}
                    </p>
                    <div className="px-3.5 py-2.5 text-sm leading-relaxed"
                      style={{
                        background:   mine ? '#10b981' : '#f3f4f6',
                        color:        mine ? '#fff' : '#111827',
                        borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        opacity:      isTemp ? 0.7 : 1,
                        transition:   'opacity 0.2s',
                      }}>
                      {m.text}
                    </div>
                    <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-1">
                      {isTemp ? 'Sending…' : timeAgo(m.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message…"
              className={inputCls}
            />
            <button onClick={sendMessage}
              className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center text-white text-base flex-shrink-0 transition-colors">
              →
            </button>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tab === 'tasks' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-6">
          <div className="flex gap-2 mb-4">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a new task…"
              className={inputCls}
            />
            <button onClick={addTask}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold flex-shrink-0 transition-colors">
              Add
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['todo', 'To Do', 'bg-gray-100 dark:bg-gray-800', 'text-gray-700 dark:text-gray-300'],
              ['done', 'Done',  'bg-teal-50 dark:bg-teal-950',  'text-teal-800 dark:text-teal-300'],
            ].map(([status, label, bg, tc]) => (
              <div key={status}>
                <span className={`inline-block text-xs font-bold rounded-lg px-2.5 py-1 mb-2 ${bg} ${tc}`}>
                  {label} ({tasks.filter((t) => t.status === status).length})
                </span>
                {tasks.filter((t) => t.status === status).length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center text-xs text-gray-400">
                    Empty
                  </div>
                )}
                {tasks.filter((t) => t.status === status).map((t) => {
                  const isTemp = t.id?.startsWith('temp-')
                  return (
                    <div key={t.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 mb-2"
                      style={{ opacity: isTemp ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                      <p className="text-xs text-gray-800 dark:text-gray-200 font-medium mb-1">{t.title}</p>
                      <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                        Added by{' '}
                        <span className="font-semibold text-gray-500 dark:text-gray-400">
                          {t.created_by === user?.id ? 'you' : <MemberName userId={t.created_by} />}
                        </span>
                        {t.status === 'done' && t.completed_by && (
                          <>
                            {' '}· Done by{' '}
                            <span className="font-semibold text-teal-600 dark:text-teal-400">
                              {t.completed_by === user?.id ? 'you' : <MemberName userId={t.completed_by} />}
                            </span>
                          </>
                        )}
                      </p>
                      {!isTemp && (
                        <div className="flex gap-1.5">
                          {status === 'todo' && (
                            <button onClick={() => moveTask(t.id)}
                              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-colors">
                              ✓ Mark Done
                            </button>
                          )}
                          <button onClick={() => deleteTask(t.id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100 transition-colors">
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <MembersTab project={project} user={user} onRemove={removeMember} />
      )}

      {/* Files */}
      {tab === 'files' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className={`w-full py-4 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all ${
                uploading
                  ? 'border-teal-400 bg-teal-50 dark:bg-teal-950 text-teal-600 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-700 text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950'
              }`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mx-auto">
                    <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span>Uploading… {uploadProgress}%</span>
                </div>
              ) : (
                <span>📎 Click to upload a file <span className="text-xs font-normal">(max 20MB)</span></span>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                <span className="text-4xl mb-3">📁</span>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No files yet</p>
                <p className="text-xs mt-1">Upload files to share with your team</p>
              </div>
            ) : files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <span className="text-2xl flex-shrink-0">{fileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatBytes(file.size)} · {file.uploader_name} · {timeAgo(file.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={file.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-colors">
                    Open
                  </a>
                  {(isOwner || file.uploaded_by === user?.id) && (
                    <button onClick={() => deleteFile(file)}
                      className="text-xs px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100 transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setShowCompleteModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="text-center mb-5">
              <span className="text-4xl">🎉</span>
              <h3 className="text-base font-black text-gray-900 dark:text-white mt-3">Complete Project?</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                This will mark "{project.title}" as completed, remove it from the feed and Project Space.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={completeProject} disabled={completing}
                className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {completing ? 'Completing…' : 'Yes, Complete!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="text-center mb-5">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-base font-black text-gray-900 dark:text-white mt-3">Delete Project?</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                This will permanently delete "{project.title}" including all chats, tasks, and files. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteProject} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}