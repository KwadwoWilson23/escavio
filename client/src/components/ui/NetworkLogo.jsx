export function MTNLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#FFCC00" />
      <path d="M8 32V20l6 8 6-8v12h-3V25.5l-3 4-3-4V32H8z" fill="#003068" />
      <path d="M23 20h10v3h-3.5v9h-3v-9H23v-3z" fill="#003068" />
      <path d="M34 32V20h3l5 7.5V20h3v12h-3l-5-7.5V32h-3z" fill="#003068" />
    </svg>
  )
}

export function TelecelLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#E60000" />
      <path d="M12 17h24v3H26.5v11h-5V20H12v-3z" fill="white" />
      <circle cx="24" cy="33" r="2.5" fill="white" />
    </svg>
  )
}

export function AirtelTigoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#ED1C24" />
      <path d="M24 12c-2.5 0-4.8 1.2-6.5 3.2C15.8 17.2 15 20.3 15 24c0 3.7.8 6.8 2.5 8.8 1.7 2 4 3.2 6.5 3.2s4.8-1.2 6.5-3.2c1.7-2 2.5-5.1 2.5-8.8 0-3.7-.8-6.8-2.5-8.8C28.8 13.2 26.5 12 24 12z" fill="none" stroke="white" strokeWidth="2.5" />
      <path d="M24 18c-1 0-2 .6-2.7 1.6-.7 1-.7 2.4-.7 4.4s0 3.4.7 4.4c.7 1 1.7 1.6 2.7 1.6s2-.6 2.7-1.6c.7-1 .7-2.4.7-4.4s0-3.4-.7-4.4C26 18.6 25 18 24 18z" fill="white" />
    </svg>
  )
}

export function MobileMoneyLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#6B7280" />
      <rect x="16" y="12" width="16" height="24" rx="3" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="24" cy="31" r="1.5" fill="white" />
      <line x1="19" y1="15" x2="29" y2="15" stroke="white" strokeWidth="1.5" />
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
