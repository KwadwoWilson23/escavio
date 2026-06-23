export function MTNLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="16" fill="#FFC800" />
      <ellipse cx="60" cy="62" rx="46" ry="30" fill="#003478" />
      <ellipse cx="60" cy="62" rx="42" ry="26" fill="none" stroke="#FFC800" strokeWidth="2" />
      <text x="60" y="72" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="30" fill="#FFC800" letterSpacing="2">MTN</text>
    </svg>
  )
}

export function TelecelLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="16" fill="#FFFFFF" />
      <circle cx="60" cy="60" r="42" fill="#E30613" />
      <text x="60" y="78" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="52" fill="#FFFFFF">t</text>
    </svg>
  )
}

export function AirtelTigoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="16" fill="#003478" />
      <path d="M0 85 Q60 65 120 85 L120 120 L0 120 Z" fill="#E30613" />
      <text x="60" y="68" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="48" fill="#FFFFFF" letterSpacing="1">at</text>
    </svg>
  )
}

export function MobileMoneyLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="16" fill="#6B7280" />
      <rect x="38" y="22" width="44" height="76" rx="8" fill="none" stroke="white" strokeWidth="5" />
      <circle cx="60" cy="84" r="4" fill="white" />
      <line x1="48" y1="30" x2="72" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function NetworkLogo({ network, size = 40 }) {
  if (network === 'MTN MoMo') return <MTNLogo size={size} />
  if (network === 'Telecel Cash') return <TelecelLogo size={size} />
  if (network === 'AirtelTigo') return <AirtelTigoLogo size={size} />
  return <MobileMoneyLogo size={size} />
}

export function detectNetwork(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  const prefix = digits.startsWith('233') ? digits.slice(3, 5) : digits.startsWith('0') ? digits.slice(1, 3) : digits.slice(0, 2)
  if (['24', '25', '53', '54', '55', '59'].includes(prefix)) return 'MTN MoMo'
  if (['20', '50'].includes(prefix)) return 'Telecel Cash'
  if (['26', '27', '56', '57'].includes(prefix)) return 'AirtelTigo'
  return 'Mobile Money'
}
