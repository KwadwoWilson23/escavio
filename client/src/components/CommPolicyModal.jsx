import { Shield, Lock, FileText, Scale, Phone } from 'lucide-react'

const policies = [
  { icon: Lock, title: 'Encrypted', desc: 'Your conversations are secured with AES-256 encryption. No third party can read your messages.' },
  { icon: FileText, title: 'Recorded', desc: 'All communication is permanently logged and timestamped for your protection. Messages cannot be deleted by either party.' },
  { icon: Scale, title: 'Admissible', desc: 'In the event of a dispute, Escavio may share your conversation history with our dispute resolution team or relevant legal authorities if required.' },
  { icon: Shield, title: 'Binding', desc: 'Any agreements made in Escavio chat regarding your property, lease terms, or payments are considered part of your tenancy record.' },
  { icon: Phone, title: 'Protected', desc: 'Your real phone number is never shared with the other party. All calls are routed through Escavio\'s secure relay.' },
]

export default function CommPolicyModal({ onAccept }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold">Escavio Communication Policy</h2>
          <p className="text-xs text-text-muted mt-1">Please review before using messages or calls</p>
        </div>

        <p className="text-sm text-text-muted leading-relaxed">
          All messages and calls between tenants and landlords on Escavio are:
        </p>

        <div className="space-y-4">
          {policies.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-xl p-3 border border-surface-border">
          <p className="text-xs text-text-muted leading-relaxed">
            Everything about your property must be discussed and agreed inside the Escavio app. Transactions, agreements, or promises made outside the app are not covered by Escavio's guarantee or dispute resolution.
          </p>
        </div>

        <button onClick={onAccept} className="btn-primary w-full py-3.5 text-base font-semibold">
          I Understand and Agree
        </button>
      </div>
    </div>
  )
}
