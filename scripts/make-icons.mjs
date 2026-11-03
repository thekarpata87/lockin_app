// Generates the app icons as PNGs with no dependencies.
// Design: orange square on near-black, over a 1px technical grid (8×8 cells).
// The orange square covers the center 50%, inside the maskable safe zone.
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x0d, 0x0d, 0x0c]
const LINE = [0x2c, 0x2c, 0x2a]
const ACCENT = [0xff, 0x6a, 0x14]

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size) {
  const cells = 8
  const cell = size / cells
  const line = Math.max(1, Math.round(size / 256)) // ~1px at 180-256, 2px at 512
  const lo = Math.round(size * 0.25)
  const hi = Math.round(size * 0.75)
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const onGrid = (x % cell) < line || (y % cell) < line
      let c = onGrid ? LINE : BG
      if (x >= lo && x < hi && y >= lo && y < hi) c = ACCENT
      const i = y * (size * 3 + 1) + 1 + x * 3
      raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = 'public/icons/'
writeFileSync(out + 'icon-192.png', png(192))
writeFileSync(out + 'icon-512.png', png(512))
writeFileSync(out + 'icon-512-maskable.png', png(512))
writeFileSync(out + 'apple-touch-icon-180.png', png(180))

const svgLines = Array.from({ length: 7 }, (_, i) => (i + 1) * 4)
  .map((p) => `<path d="M${p} 0V32M0 ${p}H32" stroke="#2C2C2A" stroke-width="0.5"/>`)
  .join('')
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0D0D0C"/>${svgLines}<rect x="8" y="8" width="16" height="16" fill="#FF6A14"/></svg>\n`,
)
// iOS launch images: the first frame of the splash (dark background, 4-column grid).
// [css width, css height, device pixel ratio]
const DEVICES = [
  [375, 667, 2], [375, 812, 3], [414, 896, 2], [414, 896, 3], [390, 844, 3],
  [428, 926, 3], [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3],
]
function splash(w, h, dpr) {
  const W = w * dpr
  const H = h * dpr
  const gutter = 8 * dpr
  const xs = [0, 1, 2, 3, 4].map((i) => Math.round(gutter + (i * (W - 2 * gutter)) / 4))
  const row = Buffer.alloc(W * 3 + 1)
  row[0] = 0
  for (let x = 0; x < W; x++) {
    const onLine = xs.some((lx) => x >= lx && x < lx + dpr)
    const c = onLine ? LINE : BG
    row[1 + x * 3] = c[0]; row[2 + x * 3] = c[1]; row[3 + x * 3] = c[2]
  }
  const raw = Buffer.alloc(row.length * H)
  for (let y = 0; y < H; y++) row.copy(raw, y * row.length)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ])
}
mkdirSync('public/splash', { recursive: true })
const links = []
for (const [w, h, dpr] of DEVICES) {
  const name = `splash/launch-${w * dpr}x${h * dpr}.png`
  writeFileSync('public/' + name, splash(w, h, dpr))
  links.push(`    <link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" href="%BASE_URL%${name}" />`)
}
writeFileSync('scripts/startup-links.html', links.join('\n') + '\n')
console.log('Icons and launch images written')
