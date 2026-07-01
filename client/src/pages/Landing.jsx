import { Link } from 'react-router-dom'
import { Shield, Gavel, Brain, ArrowRight, Landmark, Phone, Mail, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-text-primary text-sm pr-4">{question}</span>
        {open ? <ChevronUp size={18} className="text-primary flex-shrink-0" /> : <ChevronDown size={18} className="text-text-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-text-muted leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-surface-border px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Escavio logo" width="36" height="36" className="w-9 h-9 rounded-lg" />
          <span className="text-xl font-bold text-primary tracking-tight">Escavio</span>
        </div>
        <nav aria-label="Main navigation">
          <Link to="/login" className="text-sm text-primary font-semibold">Sign In</Link>
        </nav>
      </header>

      <main className="pt-24 pb-16 px-5 space-y-16 max-w-lg mx-auto">
        <section className="text-center space-y-5" aria-label="Hero">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Shield size={12} aria-hidden="true" />
            Secured by Moolre
          </div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
            Pay Rent <span className="text-primary">Monthly.</span><br />
            Landlords Get Paid <span className="text-primary">Upfront.</span>
          </h1>
          <p className="text-text-muted text-base leading-relaxed">
            Escavio is Ghana's rent escrow platform. Tenants pay monthly via Mobile Money, landlords receive upfront capital. Compliant with the Ghana Rent Act 2026.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link to="/register?role=tenant" className="btn-primary flex items-center justify-center gap-2">
              I'm a Tenant <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/register?role=landlord" className="btn-secondary flex items-center justify-center gap-2">
              I'm a Landlord <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="space-y-4" aria-label="Key features">
          <h2 className="sr-only">Why Choose Escavio</h2>
          {[
            { icon: Shield, title: 'Secured by Moolre', desc: 'Bank-grade encryption for every transaction. Your rent is held in secure escrow, never by individuals.' },
            { icon: Gavel, title: 'Ghana Rent Act 2026 Compliant', desc: 'Fully compliant with the Rent Act — max 6 months advance, transparent fee structure, automated enforcement.' },
            { icon: Brain, title: 'AI-Powered Verification & Disputes', desc: 'Instant Ghana Card KYC verification and fair, fast AI dispute resolution for tenants and landlords.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-muted mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6" aria-label="How it works">
          <div className="text-center">
            <h2 className="text-xl font-bold text-text-primary">How Escavio Works</h2>
            <div className="h-1 w-16 bg-primary mx-auto mt-2 rounded-full" aria-hidden="true" />
          </div>
          {[
            { num: '1', title: 'Monthly Rent Payments', desc: 'Tenants pay rent monthly into a secure Escavio escrow account via MTN MoMo, Telecel Cash, or AirtelTigo Money.' },
            { num: '2', title: 'Landlord Capital Advance', desc: 'Escavio fronts the advance to the landlord upfront, so they get the capital they need immediately.' },
            { num: '3', title: 'Automatic Disbursement', desc: 'Smart scheduling handles payouts automatically on the due date. No chasing, no delays.' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="glass-card p-5 relative">
              <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm" aria-hidden="true">
                {num}
              </span>
              <h3 className="font-semibold text-text-primary mt-1">{title}</h3>
              <p className="text-sm text-text-muted mt-2">{desc}</p>
            </div>
          ))}
        </section>

        <section className="glass-card p-6 relative overflow-hidden" aria-label="Payment security">
          <Landmark size={120} className="absolute -top-4 -right-4 text-surface-border/40" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-text-primary">
              Secure Payments with <span className="text-primary">Moolre</span>
            </h2>
            <p className="text-sm text-text-muted mt-3 leading-relaxed">
              Escavio uses Moolre's enterprise-grade payment infrastructure to manage escrow. Accept MTN MoMo, Telecel Cash, and AirtelTigo Money. Your money is never held by individuals — only by secure, audited systems.
            </p>
          </div>
        </section>

        <section className="space-y-3" aria-label="Frequently asked questions">
          <div className="text-center">
            <h2 className="text-xl font-bold text-text-primary">Frequently Asked Questions</h2>
            <div className="h-1 w-16 bg-primary mx-auto mt-2 rounded-full" aria-hidden="true" />
          </div>
          <FAQItem
            question="How does Escavio work for tenants?"
            answer="Sign up, get verified with your Ghana Card, and start paying rent monthly via Mobile Money. Your rent goes into a secure escrow account managed by Moolre. No more paying large advance rent upfront."
          />
          <FAQItem
            question="How does Escavio work for landlords?"
            answer="List your property, create a lease, and receive your rent upfront or on your preferred schedule. Escavio collects monthly from tenants and guarantees your payments."
          />
          <FAQItem
            question="Is Escavio compliant with the Ghana Rent Act 2026?"
            answer="Yes. Escavio enforces the Rent Act's 6-month advance cap automatically. All lease terms and payment structures are designed to comply with current Ghanaian rental law."
          />
          <FAQItem
            question="What payment methods are accepted?"
            answer="We accept MTN MoMo, Telecel Cash, and AirtelTigo Money. All transactions are processed securely through Moolre's payment infrastructure."
          />
          <FAQItem
            question="Is my money safe?"
            answer="Absolutely. All funds are held in secure escrow powered by Moolre's enterprise-grade systems. Your money is never held by individuals — only by audited, regulated infrastructure."
          />
        </section>

        <section className="glass-card p-6 text-center space-y-4" aria-label="Contact support">
          <h2 className="text-lg font-bold text-text-primary">Need Help?</h2>
          <p className="text-sm text-text-muted">Our support team is ready to assist you.</p>
          <div className="flex flex-col items-center gap-2">
            <a href="tel:+233504399802" className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
              <Phone size={14} aria-hidden="true" />
              0504399802
            </a>
            <a href="mailto:support@escavio.site" className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
              <Mail size={14} aria-hidden="true" />
              support@escavio.site
            </a>
          </div>
        </section>

        <footer className="text-center text-text-dim text-xs pb-4 space-y-3">
          <p className="text-text-muted">Ghana's first AI-powered rent escrow platform.</p>
          <div className="flex justify-center gap-4">
            <Link to="/terms" className="text-text-muted hover:text-primary">Terms of Service</Link>
            <Link to="/privacy" className="text-text-muted hover:text-primary">Privacy Policy</Link>
          </div>
          <p className="text-text-dim">&copy; 2026 Escavio. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
