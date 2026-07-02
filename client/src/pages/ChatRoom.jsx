import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Lock } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export default function ChatRoom() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conv, setConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/conversations/${id}`),
          api.get(`/conversations/${id}/messages`),
        ])
        setConv(convRes.data)
        setMessages(msgRes.data)
      } catch {
        navigate('/dashboard/messages')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!supabase || !id) return
    const channel = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, async () => {
        try {
          const { data } = await api.get(`/conversations/${id}/messages`)
          setMessages(data)
        } catch {}
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    try {
      const { data } = await api.post(`/conversations/${id}/messages`, { content })
      setMessages(prev => [...prev, data])
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const otherName = user?.role === 'landlord'
    ? conv?.tenant?.full_name || 'Tenant'
    : conv?.landlord?.full_name || 'Landlord'

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
        <button onClick={() => navigate('/dashboard/messages')} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{otherName}</h2>
          <p className="text-[10px] text-text-dim truncate">{conv?.property?.address}</p>
        </div>
        <Lock size={14} className="text-accent-success" />
      </div>

      <div className="bg-surface-card/50 rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
        <Shield size={12} className="text-primary flex-shrink-0" />
        <p className="text-[10px] text-text-muted leading-tight">
          All conversations are encrypted and recorded by Escavio. Any agreements made here are legally binding under your lease.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-surface-card border border-surface-border rounded-bl-md'
              }`}>
                <p>{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                  <span className={`text-[9px] ${isMe ? 'text-white/60' : 'text-text-dim'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && msg.is_read && (
                    <span className="text-[9px] text-white/60">read</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-surface-border">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 text-sm"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
