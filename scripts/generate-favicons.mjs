import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'client', 'public')
const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'))

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name))
  console.log(`Generated ${name} (${size}x${size})`)
}

const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer()
writeFileSync(join(publicDir, 'favicon.ico'), png32)
console.log('Generated favicon.ico (32x32 PNG)')

console.log('Done!')
