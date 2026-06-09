import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'

const sections = [
  {
    title: '1. Data We Collect',
    content: 'We collect: your name, phone number, email, Ghana Card details (for KYC), property addresses, payment history, and conversation data with our AI assistant. We do not collect biometric data beyond your Ghana Card photo.',
  },
  {
    title: '2. How We Use Your Data',
    content: 'Your data is used to: verify your identity, process rent payments via Moolre, manage lease agreements, send payment reminders via SMS and WhatsApp, provide AI-powered dispute resolution, and improve our services.',
  },
  {
    title: '3. Payment Processing',
    content: 'All payments are processed through Moolre\'s secure infrastructure. Escavio does not store your mobile money PIN or financial credentials. Transaction references are stored for record-keeping and dispute resolution.',
  },
  {
    title: '4. AI Processing',
    content: 'We use AI (powered by Anthropic Claude via OpenRouter) to: summarize lease terms, analyze disputes, generate payment reminders, verify Ghana Card documents, and power our WhatsApp assistant Ama. AI outputs are advisory and reviewed for accuracy.',
  },
  {
    title: '5. Data Storage',
    content: 'Your data is stored securely on Supabase (PostgreSQL) with row-level security policies. Ghana Card images are processed in real-time and not permanently stored. Conversation history with Ama is retained for 12 months.',
  },
  {
    title: '6. Third-Party Sharing',
    content: 'We share data with: Moolre (payment processing), OpenRouter/Anthropic (AI services, anonymized), and your landlord/tenant (lease-related information only). We never sell your personal data to advertisers.',
  },
  {
    title: '7. Your Rights',
    content: 'Under the Ghana Data Protection Act 2012, you have the right to: access your personal data, request corrections, request deletion of your account, withdraw consent for data processing, and lodge a complaint with the Data Protection Commission.',
  },
  {
    title: '8. Data Retention',
    content: 'Account data is retained while your account is active. Payment records are kept for 7 years per Ghana financial regulations. You may request account deletion at any time through the Settings page.',
  },
  {
    title: '9. Cookies & Tracking',
    content: 'Escavio uses essential cookies only for authentication. We do not use tracking cookies, advertising pixels, or third-party analytics that identify you personally.',
  },
]

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface px-5 py-12 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={-1} className="text-primary">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>

      <p className="text-xs text-text-dim mb-6">Last updated: June 2026 | Escavio Ghana Ltd.</p>

      <div className="space-y-4">
        {sections.map(s => (
          <GlassCard key={s.title}>
            <h2 className="font-semibold text-sm text-primary mb-2">{s.title}</h2>
            <p className="text-sm text-text-muted leading-relaxed">{s.content}</p>
          </GlassCard>
        ))}
      </div>

      <p className="text-xs text-text-dim text-center mt-8 pb-8">
        Data Protection Officer: dpo@escavio.com
      </p>
    </div>
  )
}
