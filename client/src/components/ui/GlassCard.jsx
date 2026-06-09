export default function GlassCard({ children, className = '', glow, onClick }) {
  const glowClass = glow === 'primary' ? 'border-primary/30 shadow-md shadow-primary/5' : glow === 'success' ? 'border-accent-success/30' : ''
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 ${glowClass} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
