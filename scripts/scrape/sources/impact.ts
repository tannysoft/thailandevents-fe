import { enrichEach, getHtml, throttle } from '../lib/http'
import {
  classify,
  excerpt,
  htmlToParagraphs,
  normalizeTitle,
  parseThaiDateRange,
  slugify,
  stripTags,
} from '../lib/text'
import { sanitizeEventHtml } from '../../../src/lib/sanitize'
import type { EventCategory, EventRecord } from '../../../src/lib/types'

const ORIGIN = 'https://www.impact.co.th'
const CALENDAR = `${ORIGIN}/th/visitors/event-calendar`

/** IMPACT is five bookable buildings; visitors think of them as separate places. */
const BUILDING_TO_VENUE: Record<string, string> = {
  'อิมแพ็ค อารีน่า': 'impact-arena',
  ธันเดอร์โดม: 'thunder-dome',
  'อิมแพ็ค ชาเลนเจอร์': 'impact-challenger',
  'อิมแพ็ค ฟอรั่ม': 'impact-forum',
  'ศูนย์แสดงสินค้า อิมแพ็ค เมืองทองธานี': 'impact-exhibition',
}

const PATH_TO_CATEGORY: Record<string, EventCategory> = {
  concert: 'concert',
  convention: 'conference',
  'exhibition-trade': 'exhibition',
  'exhibition-public': 'exhibition',
  'special-event': 'other',
}

const ITEM = /eb-event-item-grid-default-layout(.*?)(?=eb-event-item-grid-default-layout|<\/body)/gs

/** The calendar renders one month at a time; walk forward from today. */
function monthWindows(months: number) {
  const today = new Date()
  return Array.from({ length: months }, (_, offset) => {
    const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1))
    return { month: cursor.getUTCMonth() + 1, year: cursor.getUTCFullYear() }
  })
}

function calendarUrl(language: 'th' | 'en', month: number, year: number) {
  const filter = `custom_date:month_${month}_year_${year}_status:ongoing,upcoming`
  return `${ORIGIN}/${language}/visitors/event-calendar?filter_duration=${filter}&custom_sort=asc`
}

interface ParsedItem {
  slug: string
  path: string
  title: string
  dateText: string
  building: string
  price: string
  image?: string
}

function parseItems(html: string): ParsedItem[] {
  const items: ParsedItem[] = []
  for (const [, block] of html.matchAll(ITEM)) {
    const link = /class="eb-event-title" href="([^"]+)">([^<]*)</.exec(block)
    const dateText = /eb-event-date-time[\s\S]*?<\/i>\s*([^<]+)/.exec(block)
    if (!link || !dateText) continue

    const path = link[1]
    items.push({
      slug: path.split('/').pop() ?? '',
      path,
      title: normalizeTitle(link[2]),
      dateText: normalizeTitle(dateText[1]),
      building: stripTags(/eb-event-location[\s\S]*?<span>([^<]*)/.exec(block)?.[1] ?? ''),
      price: stripTags(/eb-individual-price">([^<]*)/.exec(block)?.[1] ?? ''),
      image: /<img src="([^"]+)"[^>]*class="eb-event-thumb"/.exec(block)?.[1],
    })
  }
  return items
}

interface Detail {
  contentHtml: string
  time?: string
  hall?: string
  /** Full-size poster; the listing only carries a 270px thumbnail. */
  image?: string
}

function property(panel: string, icon: string): string | undefined {
  return new RegExp(`${icon}"[\\s\\S]*?eb-event-property-value[^>]*>([\\s\\S]*?)</dd>`).exec(panel)?.[1]
}

/** Reads one Joomla event page: a facts list, then the full write-up including organiser contacts. */
function parseDetail(html: string): Detail {
  const panel = html.slice(Math.max(0, html.indexOf('imp-whatson-detail')))
  // The location value reads "<a>building</a> Hall 6-7"; the text after the link is the hall.
  const location = property(panel, 'fa-map-marker-alt') ?? ''

  const afterFacts = panel.slice(panel.indexOf('</dl>') + '</dl>'.length)
  const end = afterFacts.search(/<div class="sharing/)
  const body = end === -1 ? afterFacts.slice(0, 10_000) : afterFacts.slice(0, end)

  return {
    contentHtml: sanitizeEventHtml(body, ORIGIN),
    image: /<img src="([^"]+)"[^>]*class="eb-event-large-image/.exec(html)?.[1],
    time: stripTags(property(panel, 'fa-clock') ?? '') || undefined,
    hall: stripTags(location.replace(/<a[\s\S]*?<\/a>/, '')) || undefined,
  }
}

/**
 * IMPACT publishes the same Joomla calendar in Thai and English; the URL slug is shared,
 * so the English pass only contributes titles.
 */
export async function scrapeImpact(fetchedAt: string, months = 16): Promise<EventRecord[]> {
  const byId = new Map<string, EventRecord>()
  const englishTitles = new Map<string, string>()

  for (const { month, year } of monthWindows(months)) {
    for (const item of parseItems(await getHtml(calendarUrl('en', month, year)))) {
      englishTitles.set(item.slug, item.title)
    }
    await throttle()
  }

  for (const { month, year } of monthWindows(months)) {
    for (const item of parseItems(await getHtml(calendarUrl('th', month, year)))) {
      const range = parseThaiDateRange(item.dateText)
      if (!range) continue

      const english = englishTitles.get(item.slug)
      const pathCategory = /event-calendar\/([a-z-]+)\//.exec(item.path)?.[1] ?? ''
      const title = english ?? item.title

      byId.set(`impact--${item.slug}`, {
        id: `impact--${item.slug}`,
        slug: `impact-${slugify(title) || item.slug}`,
        title,
        titleTh: item.title !== title ? item.title : undefined,
        startDate: range.startDate,
        endDate: range.endDate,
        venueId: BUILDING_TO_VENUE[item.building] ?? 'impact-exhibition',
        // The building IS the venue here, so repeating it as a hall says nothing.
        hall: BUILDING_TO_VENUE[item.building] ? undefined : item.building || undefined,
        category: PATH_TO_CATEGORY[pathCategory] ?? classify([pathCategory], title),
        sourceCategories: pathCategory ? [pathCategory] : [],
        image: item.image ? new URL(item.image, ORIGIN).href : undefined,
        url: new URL(item.path, ORIGIN).href,
        price: item.price && item.price !== 'N/A' ? item.price : undefined,
        source: { name: 'IMPACT เมืองทองธานี (impact.co.th)', url: CALENDAR, fetchedAt },
      })
    }
    await throttle()
  }

  // The listing has no body copy; each event page carries the write-up, hours and hall.
  const events = [...byId.values()]
  await enrichEach(events, async (event) => {
    const detail = parseDetail(await getHtml(event.url))
    event.contentHtml = detail.contentHtml || undefined
    event.summary = excerpt(htmlToParagraphs(detail.contentHtml))
    event.time = detail.time
    event.hall = detail.hall ?? event.hall
    if (detail.image) event.image = new URL(detail.image, ORIGIN).href
  })

  return events
}
