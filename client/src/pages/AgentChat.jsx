import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Bot, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/ui/GlassCard'
import api from '../services/api'

export default function AgentChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/whatsapp/conversations')
      .then(({ data }) => setMessages(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg, created_at: new Date().toISOString() }])
    setSending(true)

    try {
      const { data } = await api.post('/whatsapp/test', { phone: 'web-chat', message: userMsg })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, created_at: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.', created_at: new Date().toISOString() }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-bold">Ama</h1>
          <p className="text-xs text-primary">AI Assistant &bull; Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-text-muted">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={32} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Hi! I'm Ama</p>
              <p className="text-sm text-text-muted mt-1 max-w-xs">
                Your Escavio AI assistant. Ask me about your lease, payments, or anything rental-related.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {['How much do I owe?', 'When is my next payment?', 'Summarize my lease'].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs text-text-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'glass-card rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-surface-border">
        <input
          type="text"
          placeholder="Ask Ama anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-50"
        >
          <Send size={18} className="text-white" />
        </button>
      </form>
    </div>
  )
}
