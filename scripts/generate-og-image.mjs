import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'client', 'public')

const width = 1200
const height = 630

const svgImage = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B1120"/>
      <stop offset="100%" stop-color="#1a2744"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <g opacity="0.05">
    ${Array.from({length: 30}, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="${height}" stroke="white" stroke-width="1"/>`).join('')}
    ${Array.from({length: 16}, (_, i) => `<line x1="0" y1="${i * 40}" x2="${width}" y2="${i * 40}" stroke="white" stroke-width="1"/>`).join('')}
  </g>

  <!-- Shield icon (simplified) -->
  <g transform="translate(100, 140) scale(0.85)">
    <path d="M100 0 L190 40 C190 40 195 45 195 55 L195 130 C195 185 155 215 100 240 C45 215 5 185 5 130 L5 55 C5 45 10 40 10 40 Z" fill="white" opacity="0.15"/>
    <circle cx="100" cy="130" r="20" fill="white" opacity="0.15"/>
    <path d="M92 130 L92 180 C92 185 95 188 100 188 C105 188 108 185 108 180 L108 130" fill="white" opacity="0.15"/>
  </g>

  <!-- Main text -->
  <text x="340" y="220" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="white">
    <tspan fill="#2563EB">E</tspan><tspan fill="white">scavio</tspan>
  </text>

  <!-- Tagline -->
  <text x="340" y="290" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#94a3b8">
    Pay Rent Monthly. Landlords Get Paid Upfront.
  </text>

  <!-- Features -->
  <g transform="translate(340, 340)">
    <rect x="0" y="0" width="12" height="12" rx="6" fill="#2563EB"/>
    <text x="24" y="12" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#cbd5e1">Secure Escrow via Mobile Money</text>

    <rect x="0" y="40" width="12" height="12" rx="6" fill="#2563EB"/>
    <text x="24" y="52" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#cbd5e1">AI-Powered KYC &amp; Dispute Resolution</text>

    <rect x="0" y="80" width="12" height="12" rx="6" fill="#2563EB"/>
    <text x="24" y="92" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#cbd5e1">Ghana Rent Act 2026 Compliant</text>
  </g>

  <!-- Domain -->
  <rect x="340" y="490" width="200" height="44" rx="22" fill="#2563EB"/>
  <text x="440" y="519" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">escavio.site</text>

  <!-- Moolre badge -->
  <text x="580" y="519" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#64748b">Secured by Moolre</text>

  <!-- Blue accent line -->
  <rect x="0" y="${height - 6}" width="${width}" height="6" fill="#2563EB"/>
</svg>
`

await sharp(Buffer.from(svgImage))
  .png({ quality: 90 })
  .toFile(join(publicDir, 'og-image.png'))

console.log('Generated og-image.png (1200x630)')
