import { useState, useEffect, useRef } from 'react'
import { Send, Bot, Phone, Mail, Sparkles } from 'lucide-react'
import api from '../services/api'

export default function AgentChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

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
      const { data } = await api.post('/whatsapp/chat', { message: userMsg })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, created_at: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.', created_at: new Date().toISOString() }])
    } finally {
      setSending(false)
    }
  }

  function handleQuickQuestion(q) {
    setInput(q)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-md">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-text-primary">Ama</h1>
          <p className="text-xs text-primary font-medium">AI Assistant &bull; Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-text-muted">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg">
              <Sparkles size={36} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">Hi! I'm Ama</p>
              <p className="text-sm text-text-muted mt-1 max-w-xs leading-relaxed">
                Your Escavio AI assistant. Ask me about your lease, payments, disputes, or anything rental-related in Ghana.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {['How much do I owe?', 'When is my next payment?', 'Summarize my lease', 'Ghana Rent Act rules'].map(q => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3.5 py-2 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="glass-card p-4 mt-2 max-w-xs">
              <p className="text-xs font-semibold text-text-primary mb-2">Need human help?</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Phone size={12} />
                  <span>0504399802</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Mail size={12} />
                  <span>support@escavio.site</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'glass-card rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
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
