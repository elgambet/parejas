import fs from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'

const dataPath = path.resolve('data/valid-couples.json')
const outputDir = path.resolve('data/qrcodes')
const baseUrl = 'https://elgambet.github.io/parejas/'

const raw = await fs.readFile(dataPath, 'utf8')
const couples = JSON.parse(raw)

if (!Array.isArray(couples)) {
  throw new Error('Expected data/valid-couples.json to be an array')
}

await fs.mkdir(outputDir, { recursive: true })

for (const item of couples) {
  const coupleKey = String(item.coupleKey ?? '').trim()
  if (!coupleKey) continue

  const url = `${baseUrl}?couple=${encodeURIComponent(coupleKey)}`
  const outFile = path.join(outputDir, `${coupleKey}.png`)

  await QRCode.toFile(outFile, url, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 1600,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

console.log(`Generated ${couples.length} QR code files in data/qrcodes/`)
