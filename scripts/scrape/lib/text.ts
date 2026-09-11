import type { EventCategory } from '../../../src/lib/types'

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6,
  กรกฎาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
  'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/**
 * Parses the Thai date ranges Joomla EventBooking renders, e.g.
 * "05-13 กันยายน 2569", "29 ตุลาคม - 1 พฤศจิกายน 2569", "13 กันยายน 2569".
 * Buddhist years are converted to CE.
 */
export function parseThaiDateRange(input: string): { startDate: string; endDate: string } | null {
  const text = input.replace(/\s+/g, ' ').trim()
  const monthNames = Object.keys(THAI_MONTHS).join('|')

  const crossMonth = new RegExp(
    `(\\d{1,2})\\s*(${monthNames})?\\s*[-–]\\s*(\\d{1,2})\\s*(${monthNames})\\s*(\\d{4})`
  ).exec(text)
  if (crossMonth) {
    const [, d1, m1, d2, m2, yearRaw] = crossMonth
    const year = toCE(Number(yearRaw))
    const endMonth = THAI_MONTHS[m2]
    const startMonth = m1 ? THAI_MONTHS[m1] : endMonth
    // A range that wraps December into January belongs to the previous year.
    const startYear = startMonth > endMonth ? year - 1 : year
    return { startDate: iso(startYear, startMonth, Number(d1)), endDate: iso(year, endMonth, Number(d2)) }
  }

  const single = new RegExp(`(\\d{1,2})\\s*(${monthNames})\\s*(\\d{4})`).exec(text)
  if (single) {
    const [, d, m, yearRaw] = single
    const date = iso(toCE(Number(yearRaw)), THAI_MONTHS[m], Number(d))
    return { startDate: date, endDate: date }
  }
  return null
}

const EN_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

/** Parses the English form Webflow calendars render, e.g. "06 Mar 2027". */
export function parseEnglishDate(input: string): string | null {
  const match = /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/.exec(input.trim())
  if (!match) return null
  const month = EN_MONTHS[match[2].slice(0, 3).toLowerCase()]
  if (!month) return null
  return iso(toCE(Number(match[3])), month, Number(match[1]))
}

/** Buddhist Era years (2400–2700) become Common Era. */
export function toCE(year: number): number {
  return year > 2400 ? year - 543 : year
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[’'"“”]/g, '')
    .replace(/[^a-z0-9฀-๿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

export function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
}

export function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

const CATEGORY_RULES: [RegExp, EventCategory][] = [
  [/concert|fancon|fan ?meeting|world tour|live at|showcase|แฟนคอน|คอนเสิร์ต/i, 'concert'],
  [/festival|fest\b|เทศกาล|ประเพณี/i, 'festival'],
  [/congress|conference|summit|forum|convention|seminar|symposium|annual meeting|ประชุม|สัมมนา/i, 'conference'],
  [/exhibition|expo|trade ?show|แสดงสินค้า|นิทรรศการ/i, 'exhibition'],
  [/fair|มหกรรม|งานแฟร์/i, 'fair'],
  [/sport|championship|tournament|กีฬา|แข่งขัน/i, 'sport'],
]

/**
 * Maps a venue's own category labels onto our shared taxonomy, falling back to the
 * event's own wording. `fallback` is what a venue mostly hosts, used when nothing matches.
 */
export function classify(
  labels: string[],
  title: string,
  { summary = '', fallback = 'other' }: { summary?: string; fallback?: EventCategory } = {}
): EventCategory {
  for (const haystack of [labels.join(' '), title, summary]) {
    if (!haystack) continue
    for (const [pattern, category] of CATEGORY_RULES) {
      if (pattern.test(haystack)) return category
    }
  }
  return fallback
}

/** Collapses the stray double spaces and non-breaking spaces venue CMSes leave behind. */
export function normalizeTitle(input: string): string {
  return decodeEntities(input).replace(/\s+/g, ' ').trim()
}

/**
 * Turns CMS rich text into plain paragraphs. Block tags and double breaks split
 * paragraphs, single breaks survive as newlines, and empty or zero-width leftovers go.
 */
export function htmlToParagraphs(input: string): string[] {
  const marked = input
    .replace(/<(script|style|iframe|figure)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote|tr|table)>/gi, '\n\n')

  return decodeEntities(marked.replace(/<[^>]*>/g, ''))
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.replace(/[\s\u200b-\u200d\ufeff]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
    )
    .filter((block) => block.length > 1)
}

/** First substantial paragraph, flattened and cut to `max` characters. */
export function excerpt(paragraphs: string[] | undefined, max = 220): string | undefined {
  const first = paragraphs?.find((paragraph) => paragraph.length > 40) ?? paragraphs?.[0]
  if (!first) return undefined
  const flat = first.replace(/\n+/g, ' ')
  return flat.length <= max ? flat : `${flat.slice(0, max).trimEnd()}…`
}
