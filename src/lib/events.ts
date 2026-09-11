import dataset from '@/data/events.json'
import { venuesById } from '@/data/venues'
import type { EventCategory, EventDataset, EventRecord } from '@/lib/types'

const data = dataset as EventDataset

export const generatedAt = data.generatedAt
export const sourceSummary = data.sources

export const allEvents: EventRecord[] = [...data.events].sort(
  (a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title)
)

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  exhibition: 'งานแสดงสินค้า',
  concert: 'คอนเสิร์ต',
  conference: 'ประชุม/สัมมนา',
  festival: 'เทศกาล',
  fair: 'มหกรรม',
  sport: 'กีฬา',
  other: 'อื่น ๆ',
}

/** Today in Bangkok, as `YYYY-MM-DD`. */
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
}

export function isLive(event: EventRecord, day = today()): boolean {
  return event.startDate <= day && event.endDate >= day
}

export function isUpcoming(event: EventRecord, day = today()): boolean {
  return event.endDate >= day
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
}

export function findEvent(slug: string): EventRecord | undefined {
  return allEvents.find((event) => event.slug === slug)
}

export function eventsAtVenue(venueId: string): EventRecord[] {
  return allEvents.filter((event) => event.venueId === venueId)
}

/** Events grouped by calendar month, in date order, for the timeline rail. */
export function groupByMonth(events: EventRecord[]) {
  const months = new Map<string, EventRecord[]>()
  for (const event of events) {
    const key = event.startDate.slice(0, 7)
    const bucket = months.get(key)
    if (bucket) bucket.push(event)
    else months.set(key, [event])
  }
  return [...months.entries()].map(([month, items]) => ({ month, events: items }))
}

/** List views never show full write-ups; leave them out of the client payload. */
export function toListItem(event: EventRecord): EventRecord {
  return { ...event, contentHtml: undefined }
}

export function venueOf(event: EventRecord) {
  return venuesById.get(event.venueId)
}

/** Section titles for category pages and home-page shelves. */
export const CATEGORY_TITLES: Record<EventCategory, string> = {
  concert: 'คอนเสิร์ตและการแสดง',
  exhibition: 'งานแสดงสินค้าและนิทรรศการ',
  conference: 'ประชุมและสัมมนา',
  festival: 'เทศกาล',
  fair: 'มหกรรม',
  sport: 'กีฬา',
  other: 'งานอื่น ๆ',
}

/** The order shelves and navigation follow. */
export const CATEGORY_ORDER: EventCategory[] = [
  'concert', 'exhibition', 'conference', 'festival', 'fair', 'sport', 'other',
]

export function isEventCategory(value: string): value is EventCategory {
  return (CATEGORY_ORDER as string[]).includes(value)
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Saturday and Sunday of the current week; on a Sunday, the weekend in progress. */
export function thisWeekend(day = today()) {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
  const sunday = addDays(day, (7 - weekday) % 7)
  return { saturday: addDays(sunday, -1), sunday }
}

export function overlaps(event: EventRecord, from: string, to: string): boolean {
  return event.startDate <= to && event.endDate >= from
}

const HIGHLIGHT_CATEGORIES = new Set<EventCategory>(['concert', 'exhibition', 'festival', 'conference'])

/**
 * Home-page picks without an editor: the next event that has artwork and a write-up
 * leads, and the side column takes the ones after it, one per venue where possible.
 */
export function pickHighlights(events: EventRecord[], day: string, sideCount = 4) {
  const candidates = events.filter(
    (event) =>
      event.startDate > day && event.image && event.summary && HIGHLIGHT_CATEGORIES.has(event.category)
  )
  const [lead, ...rest] = candidates
  const side: EventRecord[] = []
  const venuesUsed = new Set(lead ? [lead.venueId] : [])

  for (const event of rest) {
    if (side.length >= sideCount) break
    if (venuesUsed.has(event.venueId)) continue
    venuesUsed.add(event.venueId)
    side.push(event)
  }
  for (const event of rest) {
    if (side.length >= sideCount) break
    if (!side.includes(event)) side.push(event)
  }

  return { lead, side }
}

/** Same venue first, then same category, soonest first. */
export function relatedEvents(event: EventRecord, pool: EventRecord[], count = 4): EventRecord[] {
  const others = pool.filter((candidate) => candidate.id !== event.id)
  const sameVenue = others.filter((candidate) => candidate.venueId === event.venueId)
  const sameCategory = others.filter(
    (candidate) => candidate.category === event.category && candidate.venueId !== event.venueId
  )
  return [...sameVenue, ...sameCategory].slice(0, count)
}
