import { Link } from 'react-router-dom'
import { Shield, Gavel, Brain, ArrowRight, Landmark } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-surface-border px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Escavio" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-xl font-bold text-primary tracking-tight">Escavio</span>
        </div>
        <Link to="/login" className="text-sm text-primary font-semibold">Sign In</Link>
      </header>

      <main className="pt-24 pb-16 px-5 space-y-16 max-w-lg mx-auto">
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Shield size={12} />
            Secured by Moolre
          </div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
            Pay Rent <span className="text-primary">Monthly.</span><br />
            Landlords Get Paid <span className="text-primary">Upfront.</span>
          </h1>
          <p className="text-text-muted text-base leading-relaxed">
            Escavio bridges the gap between tenants and landlords with secure escrow — powered by Moolre.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link to="/register?role=tenant" className="btn-primary flex items-center justify-center gap-2">
              I'm a Tenant <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=landlord" className="btn-secondary flex items-center justify-center gap-2">
              I'm a Landlord <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          {[
            { icon: Shield, color: 'text-primary', bg: 'bg-primary/10', title: 'Secured by Moolre', desc: 'Bank-grade encryption for every transaction and escrow holding.' },
            { icon: Gavel, color: 'text-primary', bg: 'bg-primary/10', title: 'Rent Act Compliant', desc: 'Fully compliant with the Ghana Rent Act 2026 — max 6 months advance.' },
            { icon: Brain, color: 'text-primary', bg: 'bg-primary/10', title: 'AI Dispute Resolution', desc: 'Fair and fast resolution of rental issues via our AI protocol.' },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="glass-card p-5 flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-muted mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-text-primary">How Escavio Works</h2>
            <div className="h-1 w-16 bg-primary mx-auto mt-2 rounded-full" />
          </div>
          {[
            { num: '1', title: 'Monthly Payments', desc: 'Tenants pay rent monthly into a secure Escavio escrow account.' },
            { num: '2', title: 'Capital Advance', desc: 'Escavio fronts the advance to the landlord upfront.' },
            { num: '3', title: 'Auto-Disbursement', desc: 'Smart scheduling handles payouts automatically on the due date.' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="glass-card p-5 relative">
              <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                {num}
              </span>
              <h4 className="font-semibold text-text-primary mt-1">{title}</h4>
              <p className="text-sm text-text-muted mt-2">{desc}</p>
            </div>
          ))}
        </section>

        <section className="glass-card p-6 relative overflow-hidden">
          <Landmark size={120} className="absolute -top-4 -right-4 text-surface-border/40" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-text-primary">
              Financial Sovereignty with <span className="text-primary">Moolre</span>
            </h2>
            <p className="text-sm text-text-muted mt-3 leading-relaxed">
              Escavio uses Moolre's enterprise-grade infrastructure to manage escrow payments. Your money is never held by individuals — only by secure, audited systems.
            </p>
          </div>
        </section>

        <div className="text-center text-text-dim text-xs pb-4">
          <div className="flex justify-center gap-4">
            <Link to="/terms" className="text-text-muted hover:text-primary">Terms</Link>
            <Link to="/privacy" className="text-text-muted hover:text-primary">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
