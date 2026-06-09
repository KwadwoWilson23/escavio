import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'

const sections = [
  {
    title: '1. Service Overview',
    content: 'Escavio is a rent escrow platform that allows tenants to pay rent monthly while landlords receive their advance upfront. Escavio acts as a neutral escrow intermediary, holding tenant payments and disbursing them to landlords according to agreed schedules.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years old and a legal resident of Ghana to use Escavio. Landlords must own or legally manage the properties listed. Tenants must provide valid identification (Ghana Card) for KYC verification.',
  },
  {
    title: '3. Escrow & Payment Terms',
    content: 'All rent payments are held in a secure escrow account managed by Escavio via Moolre payment infrastructure. Disbursements follow the payout mode agreed upon in the lease (monthly, lump sum, or hybrid). Escavio does not provide loans or credit facilities.',
  },
  {
    title: '4. Ghana Rent Act 2026 Compliance',
    content: 'In accordance with the Ghana Rent Control Department enforcement effective April 2026, Escavio limits all advance rent collections to a maximum of 6 months. Any lease requesting more than 6 months advance will be automatically rejected by our system.',
  },
  {
    title: '5. Dispute Resolution',
    content: 'Escavio provides AI-assisted dispute resolution as a first step. If parties cannot reach agreement, disputes may be escalated to the Rent Control Department or appropriate legal authorities. Escavio\'s AI analysis is advisory and not legally binding.',
  },
  {
    title: '6. Fees & Charges',
    content: 'Escavio charges a processing fee on each transaction. Fee details are displayed before payment confirmation. Moolre mobile money charges may apply separately. All fees are in Ghana Cedis (GHS).',
  },
  {
    title: '7. Account Termination',
    content: 'Either party may terminate their account at any time. Outstanding escrow balances will be handled according to the lease terms. Escavio reserves the right to suspend accounts involved in fraudulent activity.',
  },
  {
    title: '8. Limitation of Liability',
    content: 'Escavio is an intermediary platform and is not liable for disputes between landlords and tenants beyond providing escrow and mediation services. Escavio does not guarantee property conditions or tenant behavior.',
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
        For questions, contact support@escavio.com
      </p>
    </div>
  )
}
