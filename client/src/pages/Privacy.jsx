import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'

const sections = [
  {
    title: '1. Data We Collect',
    content: 'We collect: your name, phone number, email, Ghana Card details (for KYC), property addresses, payment history, and conversation data with our AI assistant Ama. We also collect mobile money transaction references for record-keeping. We do not collect biometric data beyond your Ghana Card photo and selfie for verification.',
  },
  {
    title: '2. How We Use Your Data',
    content: 'Your data is used to: verify your identity (KYC), process rent payments via Moolre, manage lease agreements, send payment reminders via SMS and WhatsApp, provide AI-powered dispute resolution, facilitate communication between parties through Escavio as intermediary, and improve our services.',
  },
  {
    title: '3. Payment Processing',
    content: 'All payments are processed through Moolre\'s secure infrastructure. Escavio does not store your mobile money PIN or financial credentials. Transaction references and payment statuses (pending, success, failed) are stored for record-keeping, dispute resolution, and compliance purposes.',
  },
  {
    title: '4. AI Processing',
    content: 'We use AI (via OpenRouter) to: summarize lease terms, analyze disputes, generate payment reminders, verify Ghana Card documents, match face photos for KYC, and power our AI assistant Ama. AI outputs are advisory and reviewed for accuracy. Your conversation history with Ama is used to provide personalized assistance.',
  },
  {
    title: '5. Data Storage',
    content: 'Your data is stored securely on Supabase (PostgreSQL) with row-level security policies. Ghana Card images are processed in real-time for verification and not permanently stored as images after verification is complete. Conversation history with Ama is retained for 12 months.',
  },
  {
    title: '6. Third-Party Sharing',
    content: 'We share data with: Moolre (payment processing), OpenRouter (AI services, conversation data), and your landlord/tenant (lease-related information only, facilitated through Escavio). We never sell your personal data to advertisers or third-party marketers.',
  },
  {
    title: '7. Your Rights',
    content: 'Under the Ghana Data Protection Act 2012 (Act 843), you have the right to: access your personal data, request corrections to inaccurate data, request deletion of your account and data, withdraw consent for data processing, and lodge a complaint with the Data Protection Commission of Ghana.',
  },
  {
    title: '8. Data Retention',
    content: 'Account data is retained while your account is active. Payment records are kept for 7 years per Ghana financial regulations. KYC verification results are retained for the duration of your account. You may request account deletion at any time through the Settings page or by contacting support.',
  },
  {
    title: '9. Cookies & Tracking',
    content: 'Escavio uses essential cookies only for authentication (JWT tokens stored in local storage). We do not use tracking cookies, advertising pixels, or third-party analytics that identify you personally. Our web app is a Progressive Web App (PWA) that stores minimal data locally for offline functionality.',
  },
  {
    title: '10. Security Measures',
    content: 'We implement industry-standard security measures including: encrypted data transmission (HTTPS/TLS), secure authentication with JWT tokens, row-level database security, and regular security reviews. Despite these measures, no system is 100% secure. Report any security concerns to support@escavio.site.',
  },
  {
    title: '11. Contact',
    content: 'For privacy-related questions or to exercise your data rights, contact our support team at support@escavio.site or call/WhatsApp 0504399802. For formal data protection inquiries, email dpo@escavio.site.',
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
        Data Protection Officer: dpo@escavio.site | Support: 0504399802
      </p>
    </div>
  )
}
