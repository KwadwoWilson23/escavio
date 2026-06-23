import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'

const sections = [
  {
    title: '1. Service Overview',
    content: 'Escavio is a rent escrow platform that allows tenants to pay rent monthly while landlords receive their advance upfront. Escavio acts as a neutral escrow intermediary, holding tenant payments and disbursing them to landlords according to agreed schedules. Tenants and landlords do not communicate directly — all interactions are managed through Escavio.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years old and a legal resident of Ghana to use Escavio. Landlords must own or legally manage the properties listed. Tenants must provide valid identification (Ghana Card) for KYC verification. Both parties must have a valid Ghanaian mobile money account (MTN MoMo, Telecel Cash, or AirtelTigo Money).',
  },
  {
    title: '3. Escrow & Payment Terms',
    content: 'All rent payments are held in a secure escrow account managed by Escavio via Moolre payment infrastructure. Disbursements follow the payout mode agreed upon in the lease (monthly, lump sum, or hybrid). Escavio does not provide loans or credit facilities. A 1% platform fee is charged on each rent payment.',
  },
  {
    title: '4. Wallet & Withdrawal Policy',
    content: 'Users may deposit funds into their Escavio wallet via mobile money. Withdrawals are permitted when you have no outstanding or overdue rent obligations. If you have an active lease with overdue payments, withdrawals will be restricted until all dues are cleared. Locked escrow funds cannot be withdrawn and are reserved for landlord disbursement.',
  },
  {
    title: '5. Payment Cancellations & Failures',
    content: 'If a payment is cancelled by the user before completion, it is recorded as failed. If a mobile money prompt expires or is declined, the payment is marked as failed and can be retried. Successfully completed payments cannot be reversed through Escavio — disputes must be raised through the platform.',
  },
  {
    title: '6. Ghana Rent Act 2026 Compliance',
    content: 'In accordance with the Ghana Rent Control Department enforcement effective April 2026, Escavio limits all advance rent collections to a maximum of 6 months. Any lease requesting more than 6 months advance will be automatically rejected by our system. This protects tenants from illegal rent advance demands.',
  },
  {
    title: '7. Middleman Principle',
    content: 'Escavio operates as a strict intermediary. Tenants and landlords never communicate directly through the platform. All lease negotiations, payment queries, disputes, and communication are facilitated by Escavio. This ensures impartiality, protects both parties, and maintains auditable records of all interactions.',
  },
  {
    title: '8. Dispute Resolution',
    content: 'Escavio provides AI-assisted dispute resolution as a first step. If parties cannot reach agreement, disputes may be escalated to the Rent Control Department or appropriate legal authorities. Escavio\'s AI analysis is advisory and not legally binding. Both parties will be given opportunity to present their case.',
  },
  {
    title: '9. Fees & Charges',
    content: 'Escavio charges a 1% processing fee on each rent collection transaction. Wallet deposits and withdrawals may incur standard mobile money charges from your network provider. All fees are in Ghana Cedis (GHS) and are clearly displayed before payment confirmation.',
  },
  {
    title: '10. Account Termination',
    content: 'Either party may terminate their account at any time. Outstanding escrow balances will be handled according to the lease terms. Escavio reserves the right to suspend accounts involved in fraudulent activity, repeated payment defaults, or violation of these terms.',
  },
  {
    title: '11. Limitation of Liability',
    content: 'Escavio is an intermediary platform and is not liable for disputes between landlords and tenants beyond providing escrow and mediation services. Escavio does not guarantee property conditions, tenant behavior, or landlord compliance. Mobile money transaction failures are subject to the respective provider\'s terms.',
  },
  {
    title: '12. Contact & Support',
    content: 'For any questions or concerns about these terms, contact Escavio customer support at 0504399802 (phone/WhatsApp) or email support@escavio.site. Our AI assistant Ama is also available 24/7 through the app.',
  },
]

export default function Terms() {
  return (
    <div className="min-h-screen bg-surface px-5 py-12 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={-1} className="text-primary">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold">Terms & Conditions</h1>
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
        For questions, contact support@escavio.site | 0504399802
      </p>
    </div>
  )
}
