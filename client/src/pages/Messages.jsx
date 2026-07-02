import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Shield } from 'lucide-react'
import { ListSkeleton } from '../components/ui/Skeleton'
import GlassCard from '../components/ui/GlassCard'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/conversations')
      .then(({ data }) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="text-xs text-text-muted mt-1">All conversations are encrypted and recorded by Escavio.</p>
      </div>

      {conversations.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MessageSquare size={48} className="text-text-dim mx-auto mb-3" />
          <p className="text-text-muted">No conversations yet</p>
          <p className="text-xs text-text-dim mt-1">
            {user?.role === 'tenant'
              ? 'Send a message from any property listing to start a conversation.'
              : 'Tenants will message you about your properties.'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const otherName = user?.role === 'landlord'
              ? conv.tenant?.full_name || 'Tenant'
              : conv.landlord?.full_name || 'Landlord'
            const address = conv.property?.address || 'Property'

            return (
              <Link key={conv.id} to={`/dashboard/messages/${conv.id}`}>
                <GlassCard className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{otherName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{otherName}</h3>
                      <span className="text-[10px] text-text-dim flex-shrink-0">
                        {conv.last_message_at && new Date(conv.last_message_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">{address}</p>
                  </div>
                  <Shield size={14} className="text-text-dim flex-shrink-0" />
                </GlassCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
