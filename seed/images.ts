export interface ImageSpec {
  title: string
  emoji: string
  theme: [string, string]
  width: number
  height: number
  badge?: string
}

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) =>
    char === '<' ? '&lt;' : char === '>' ? '&gt;' : char === '&' ? '&amp;' : char === "'" ? '&apos;' : '&quot;',
  )

/**
 * Generates a lightweight SVG placeholder so the demo has real images in
 * Firebase Storage without shipping binary assets. Swap in photography by
 * dropping files into seed-images/ and re-running the seed script.
 */
export function renderSvg(spec: ImageSpec): Buffer {
  const { title, emoji, theme, width, height, badge } = spec
  const fontSize = Math.max(18, Math.round(width / 16))
  const titleY = height - Math.round(height * 0.12)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme[0]}"/>
      <stop offset="100%" stop-color="${theme[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${width * 0.82}" cy="${height * 0.22}" r="${height * 0.3}" fill="#ffffff" opacity="0.12"/>
  <circle cx="${width * 0.18}" cy="${height * 0.78}" r="${height * 0.26}" fill="#000000" opacity="0.12"/>
  <text x="50%" y="${height * 0.5}" font-size="${height * 0.32}" text-anchor="middle">${emoji}</text>
  <text x="50%" y="${titleY}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(title)}</text>
  ${badge ? `<rect x="${width * 0.06}" y="${height * 0.06}" rx="${height * 0.05}" width="${badge.length * fontSize * 0.62 + fontSize}" height="${fontSize * 1.9}" fill="#cb202d"/><text x="${width * 0.06 + (badge.length * fontSize * 0.62 + fontSize) / 2}" y="${height * 0.06 + fontSize * 1.3}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize * 0.85}" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(badge)}</text>` : ''}
</svg>
`

  return Buffer.from(svg, 'utf8')
}

export const COVER_SIZE = { width: 800, height: 500 } as const
export const BANNER_SIZE = { width: 1200, height: 420 } as const
export const DISH_SIZE = { width: 400, height: 300 } as const
