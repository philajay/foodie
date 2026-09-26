/**
 * Downloads freely licensed food photography from Wikimedia Commons into
 * `seed-images/<restaurantId>/`, which the seed script uploads to Cloud Storage.
 *
 * Only Public Domain / CC0 files are used, so nothing here requires
 * attribution. Every file's source and licence is recorded in
 * `seed-images/CREDITS.md` for traceability.
 *
 * Usage: npm run images            (fill in whatever is missing)
 *        npm run images -- --force (re-download everything)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { SEED_RESTAURANTS } from '../seed/restaurants'

/** Wikimedia's robot policy requires a descriptive User-Agent with contact. */
const USER_AGENT =
  'FoodieSeed/1.0 (https://bootcamp-e233d.web.app; philajay@gmail.com) node-fetch'
const API = 'https://commons.wikimedia.org/w/api.php'
const OUT_DIR = 'seed-images'
const THUMB_WIDTH = 1200
const MIN_WIDTH = 800
const MAX_BYTES = 3 * 1024 * 1024

/**
 * Licence tiers. Commons food photography is mostly CC BY-SA, so this script
 * falls back to attribution-required licences when the PD/CC0 pool runs dry.
 * Every download is recorded in the credits file either way.
 */
const FREE_LICENCES = ['cc0', 'public domain', 'pd-']
const ATTRIBUTION_LICENCES = ['cc by', 'cc-by', 'cc by-sa', 'cc-by-sa']

const licenceTier = (licence: string): 'free' | 'attribution' | null => {
  const value = licence.toLowerCase()
  if (FREE_LICENCES.some((needle) => value.includes(needle))) return 'free'
  if (ATTRIBUTION_LICENCES.some((needle) => value.includes(needle))) return 'attribution'
  return null
}

/** Files that are technically photographs but useless as dish imagery. */
const REJECT_TITLE =
  /(map|logo|diagram|chart|poster|icon|flag|coat of arms|stamp|banknote|book|cover|page|sign|plaque|graffiti|drawing|painting|sketch|screenshot)/i

interface CommonsPage {
  title: string
  index: number
  imageinfo?: {
    url: string
    thumburl?: string
    descriptionurl: string
    mime: string
    width: number
    height: number
    size: number
    extmetadata?: Record<string, { value: string } | undefined>
  }[]
}

interface Candidate {
  title: string
  url: string
  page: string
  width: number
  height: number
  licence: string
  tier: 'free' | 'attribution'
  author: string
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const meta = (page: CommonsPage, key: string) => stripHtml(page.imageinfo?.[0]?.extmetadata?.[key]?.value ?? '')

async function searchCommons(
  query: string,
  tier: 'free' | 'attribution',
  limit = 30,
): Promise<Candidate[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(THUMB_WIDTH),
  })

  const response = await fetch(`${API}?${params}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Commons search failed (${response.status}) for "${query}"`)

  const body = (await response.json()) as { query?: { pages?: CommonsPage[] } }
  const pages = body.query?.pages ?? []

  return pages
    .filter((page) => REJECT_TITLE.test(page.title) === false)
    .flatMap((page): Candidate[] => {
      const info = page.imageinfo?.[0]
      if (!info) return []
      if (info.mime !== 'image/jpeg' && info.mime !== 'image/png') return []
      if (info.width < MIN_WIDTH) return []
      const licence = meta(page, 'LicenseShortName') || meta(page, 'License')
      const fileTier = licenceTier(licence)
      if (fileTier !== tier) return []
      return [
        {
          title: page.title.replace(/^File:/, ''),
          url: info.thumburl ?? info.url,
          page: info.descriptionurl,
          width: info.width,
          height: info.height,
          licence,
          tier: fileTier,
          author: meta(page, 'Artist') || 'Unknown',
        },
      ]
    })
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`download failed (${response.status})`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) throw new Error(`too large (${buffer.byteLength} bytes)`)
  if (buffer.byteLength < 8_000) throw new Error('suspiciously small file')
  return buffer
}

/** Search phrases tuned for relevance — Commons titles rarely match dish names. */
const DISH_QUERIES: Record<string, string> = {
  'butter-chicken': 'butter chicken curry',
  'paneer-tikka': 'paneer tikka',
  'tandoori-platter': 'tandoori chicken skewers',
  'dal-makhani': 'dal makhani',
  'gulab-jamun': 'gulab jamun',
  'masala-chai': 'masala chai cup',
  margherita: 'margherita pizza',
  pepperoni: 'pepperoni pizza',
  'paneer-tikka-pizza': 'paneer pizza',
  'garlic-bread': 'garlic bread sticks',
  tiramisu: 'tiramisu dessert',
  'cold-cocoa': 'chocolate milkshake glass',
  'double-cheese-burger': 'cheeseburger',
  'paneer-burger': 'vegetarian burger',
  fries: 'french fries',
  'onion-rings': 'onion rings fried',
  'oreo-shake': 'chocolate milkshake',
  'hyderabadi-chicken-biryani': 'biryani plate',
  'veg-dum-biryani': 'vegetable biryani',
  'kacchi-gosht': 'mutton biryani',
  'mirchi-ka-salan': 'green chilli curry',
  'double-ka-meetha': 'bread pudding dessert',
  'quinoa-salad': 'quinoa salad bowl',
  'idli-sambar': 'idli sambar',
  'rasam-rice': 'rice bowl curry',
  'smoothie-bowl': 'mango smoothie bowl',
  'green-tea': 'green tea cup',
  'hakka-noodles': 'hakka noodles',
  'chilli-chicken': 'chilli chicken',
  'spring-rolls': 'spring rolls fried',
  'thai-curry': 'thai green curry',
  'mango-pudding': 'mango pudding dessert',
  'filter-coffee': 'south indian coffee glass',
  'cold-brew': 'iced coffee glass',
  'red-velvet': 'red velvet cake slice',
  'butter-croissant': 'croissant',
  'galouti-kebab': 'kebab skewers',
  'murgh-malai': 'tandoori chicken',
  'shahi-paneer': 'shahi paneer curry',
  'warqi-paratha': 'paratha bread',
  'shahi-firni': 'firni pudding',
}

const RESTAURANT_QUERIES: Record<string, string> = {
  'tandoori-nights': 'tandoori chicken restaurant dish',
  'pizza-palace': 'pizza restaurant table',
  'burger-barn': 'hamburger burger',
  'biryani-bazaar': 'biryani',
  'green-bowl': 'salad bowl healthy',
  'wok-wonders': 'chinese food noodles',
  'chai-and-co': 'cafe coffee pastry',
  'sunday-shabana': 'mughlai kebab feast',
}

interface Credit {
  file: string
  title: string
  author: string
  licence: string
  tier: 'free' | 'attribution'
  source: string
}

interface Job {
  restaurantId: string
  fileName: string
  queries: string[]
}

async function main() {
  const force = process.argv.includes('--force')
  const jobs: Job[] = []

  for (const restaurant of SEED_RESTAURANTS) {
    const queries = RESTAURANT_QUERIES[restaurant.id] ?? restaurant.cuisines[0] ?? 'food'
    jobs.push(
      { restaurantId: restaurant.id, fileName: 'cover', queries: [queries, 'food photography'] },
      {
        restaurantId: restaurant.id,
        fileName: 'banner',
        queries: [queries, `${queries} plate`, 'indian food thali', 'food photography plate'],
      },
    )
    for (const item of restaurant.menu) {
      jobs.push({
        restaurantId: restaurant.id,
        fileName: item.id,
        queries: [
          DISH_QUERIES[item.id] ?? item.name,
          item.name,
          queries,
          `${item.category.toLowerCase()} food`,
        ],
      })
    }
  }

  const credits: Credit[] = []
  const used = new Set<string>()
  const creditsPath = join(OUT_DIR, 'CREDITS.md')

  const previousCredits: Credit[] = []

  // Reuse the blacklist and the credit table from an earlier run, so the same
  // photo never appears twice and attribution is never lost.
  if (existsSync(creditsPath)) {
    const lines = (await readFile(creditsPath, 'utf8')).split('\n')
    for (const line of lines) {
      const cells = line.split('|').map((cell) => cell.trim())
      if (cells.length < 6 || cells[1] === 'File' || !cells[1].includes('/')) continue
      const source = cells[5].match(/\((.*)\)/)?.[1] ?? ''
      const licence = cells[4]
      previousCredits.push({
        file: cells[1],
        title: cells[2],
        author: cells[3],
        licence,
        tier: licenceTier(licence) ?? 'free',
        source,
      })
      if (cells[2]) used.add(cells[2])
      if (source) used.add(source)
    }
    console.log(`Loaded ${used.size} previously used images from CREDITS.md`)
  }
  let downloaded = 0
  let kept = 0
  let failed = 0

  for (const job of jobs) {
    const dir = join(OUT_DIR, job.restaurantId)
    const target = join(dir, `${job.fileName}.jpg`)

    if (!force && existsSync(target)) {
      kept += 1
      continue
    }

    await mkdir(dir, { recursive: true })

    let saved = false
    const tiers: ('free' | 'attribution')[] = ['free', 'attribution']
    for (const tier of tiers) {
      if (saved) break
      for (const query of job.queries) {
      if (saved) break
      let candidates: Candidate[] = []
      try {
        candidates = await searchCommons(query, tier)
      } catch (error) {
        console.warn(`  ! search failed for "${query}":`, (error as Error).message)
        continue
      }

      for (const candidate of candidates) {
        if (used.has(candidate.page) || used.has(candidate.title)) continue
        try {
          const buffer = await download(candidate.url)
          await writeFile(target, buffer)
          used.add(candidate.page)
          used.add(candidate.title)
          credits.push({
            file: `${job.restaurantId}/${job.fileName}.jpg`,
            title: candidate.title,
            author: candidate.author,
            licence: candidate.licence,
            tier: candidate.tier,
            source: candidate.page,
          })
          downloaded += 1
          saved = true
          break
        } catch (error) {
          console.warn(`  ! ${candidate.title}: ${(error as Error).message}`)
        }
      }
      }
    }

    if (!saved) {
      failed += 1
      console.warn(`  ✗ no image for ${job.restaurantId}/${job.fileName}`)
    } else {
      process.stdout.write('.')
    }
  }

  const allCredits = [
    ...(force ? [] : previousCredits),
    ...credits,
  ].filter((credit, index, list) => list.findIndex((c) => c.file === credit.file) === index)

  const rows = allCredits.map(
    (c) => `| ${c.file} | ${c.title} | ${c.author} | ${c.licence} | [Commons](${c.source}) |`,
  )

  if (rows.length > 0) {
    const attributionRows = credits.filter((c) => c.tier === 'attribution')
    if (attributionRows.length > 0) {
      console.log(`${attributionRows.length} images need attribution (CC BY / CC BY-SA).`)
    }
    const header = [
      '# Image credits',
      '',
      'Every photo here comes from Wikimedia Commons and is Public Domain or CC0',
      '(no attribution required). Generated automatically by `npm run images`.',
      '',
      '| File | Title | Author | Licence | Source |',
      '| --- | --- | --- | --- | --- |',
      ...rows,
      '',
    ].join('\n')
    await writeFile(creditsPath, header)
  }

  // Attribution has to be visible in the UI, so also emit a typed data module.
  const allRows = allCredits.map(
    (c) =>
      `  { file: ${JSON.stringify(c.file)}, title: ${JSON.stringify(c.title)}, author: ${JSON.stringify(
        c.author,
      )}, licence: ${JSON.stringify(c.licence)}, source: ${JSON.stringify(c.source)} },`,
  )
  await mkdir('src/data', { recursive: true })
  await writeFile(
    'src/data/imageCredits.ts',
    [
      '// Generated by `npm run images`. Do not edit by hand.',
      '// Every photo is Public Domain / CC0 / CC BY — listed here so attribution is visible in the app.',
      '',
      'export interface ImageCredit {',
      '  file: string',
      '  title: string',
      '  author: string',
      '  licence: string',
      '  source: string',
      '}',
      '',
      'export const imageCredits: ImageCredit[] = [',
      ...allRows,
      ']',
      '',
    ].join('\n'),
  )

  console.log(
    `\n${downloaded} downloaded, ${kept} already present, ${failed} missing. Credits: ${creditsPath}`,
  )
  const unattributed = allCredits.filter((c) => !c.file)
  if (unattributed.length > 0) {
    console.warn(`${unattributed.length} files have no credit record.`)
  }
  if (failed > 0) {
    console.log('Missing files fall back to the generated SVG placeholder during seeding.')
  }
}

main().catch((error: unknown) => {
  console.error('Image fetch failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})