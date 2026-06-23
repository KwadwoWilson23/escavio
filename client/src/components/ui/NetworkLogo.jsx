const LOGOS = {
  mtn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.svg/1200px-New-mtn-logo.svg.png',
  telecel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Vodafone_icon.svg/1200px-Vodafone_icon.svg.png',
  at: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/AirtelTigo_logo.svg/1200px-AirtelTigo_logo.svg.png',
}

function LogoImg({ src, alt, size, fallbackBg, fallbackText }) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center bg-white"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain p-1"
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div
        className="w-full h-full items-center justify-center text-white font-bold text-xs rounded-full"
        style={{ display: 'none', backgroundColor: fallbackBg }}
      >
        {fallbackText}
      </div>
    </div>
  )
}

export function MTNLogo({ size = 40 }) {
  return <LogoImg src={LOGOS.mtn} alt="MTN MoMo" size={size} fallbackBg="#FFCC00" fallbackText="MTN" />
}

export function TelecelLogo({ size = 40 }) {
  return <LogoImg src={LOGOS.telecel} alt="Telecel Cash" size={size} fallbackBg="#E60000" fallbackText="T" />
}

export function AirtelTigoLogo({ size = 40 }) {
  return <LogoImg src={LOGOS.at} alt="AirtelTigo" size={size} fallbackBg="#003478" fallbackText="AT" />
}

export function MobileMoneyLogo({ size = 40 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center bg-gray-500"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="2" width="14" height="20" rx="2.5" stroke="white" strokeWidth="2" />
        <circle cx="12" cy="18" r="1.5" fill="white" />
        <line x1="8" y1="5" x2="16" y2="5" stroke="white" strokeWidth="1.5" />
      </svg>
    </div>
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
