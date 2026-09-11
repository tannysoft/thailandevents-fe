import { getJson, throttle } from '../lib/http'
import { classify, excerpt, htmlToParagraphs, normalizeTitle, slugify } from '../lib/text'
import { sanitizeEventHtml } from '../../../src/lib/sanitize'
import type { EventRecord } from '../../../src/lib/types'

const ENDPOINT = 'https://www.bitec.co.th/api/content/events'
const CALENDAR = 'https://www.bitec.co.th/whats-on'
/** The WordPress install bitec.co.th renders from; BITEC's images are served from it too. */
const CMS = 'https://wordpress-1328545-5763448.cloudwaysapps.com/wp-json/wp/v2/event'
const PAGE_SIZE = 12
const CMS_BATCH = 50

interface BitecEvent {
  id: string
  slug: string
  title: string
  featuredImage?: { node?: { sourceUrl?: string } } | null
  eventFieldGroup: { eventStartdate?: string; eventEnddate?: string; eventHall?: string }
  eventCategories: { nodes: { name: string }[] }
}

interface BitecPage {
  events: BitecEvent[]
  hasMore: boolean
  total: number
}

interface CmsEvent {
  slug: string
  content: { rendered: string }
}

const day = (value?: string) => (value ? value.slice(0, 10) : '')

async function fetchAll(language: 'en' | 'th'): Promise<BitecEvent[]> {
  const events: BitecEvent[] = []
  for (let page = 1; page <= 20; page++) {
    const url = `${ENDPOINT}?mode=filtered&page=${page}&perPage=${PAGE_SIZE}&language=${language}`
    const data = await getJson<BitecPage>(url)
    events.push(...data.events)
    if (!data.hasMore || data.events.length === 0) break
    await throttle()
  }
  return events
}

/** The calendar API omits body copy; the CMS returns it for many slugs per request. */
async function fetchContent(slugs: string[], language: 'en' | 'th') {
  const content = new Map<string, string>()
  for (let i = 0; i < slugs.length; i += CMS_BATCH) {
    const batch = slugs.slice(i, i + CMS_BATCH).map(encodeURIComponent).join(',')
    const url = `${CMS}?lang=${language}&per_page=${CMS_BATCH}&_fields=slug,content&slug=${batch}`
    for (const item of await getJson<CmsEvent[]>(url)) {
      const html = sanitizeEventHtml(item.content.rendered, 'https://www.bitec.co.th')
      if (html) content.set(item.slug, html)
    }
    await throttle()
  }
  return content
}

/** BITEC publishes its own calendar as JSON; both languages share the `slug`. */
export async function scrapeBitec(fetchedAt: string): Promise<EventRecord[]> {
  const [english, thai] = [await fetchAll('en'), await fetchAll('th')]
  const thaiTitles = new Map(thai.map((event) => [event.slug, normalizeTitle(event.title)]))

  const slugs = english.map((event) => event.slug)
  // Descriptions are extra: if the CMS is unreachable, keep the calendar without them.
  const none = () => new Map<string, string>()
  const [thaiCopy, englishCopy] = await Promise.all([
    fetchContent(slugs, 'th').catch(none),
    fetchContent(slugs, 'en').catch(none),
  ])

  return english.map((event): EventRecord => {
    const fields = event.eventFieldGroup
    const title = normalizeTitle(event.title)
    const startDate = day(fields.eventStartdate)
    const labels = event.eventCategories.nodes.map((node) => node.name)
    const titleTh = thaiTitles.get(event.slug)
    const contentHtml = thaiCopy.get(event.slug) ?? englishCopy.get(event.slug)

    return {
      id: `bitec--${event.slug}`,
      slug: `bitec-${slugify(title) || event.slug}`,
      title,
      titleTh: titleTh && titleTh !== title ? titleTh : undefined,
      summary: contentHtml ? excerpt(htmlToParagraphs(contentHtml)) : undefined,
      contentHtml,
      startDate,
      endDate: day(fields.eventEnddate) || startDate,
      venueId: 'bitec',
      hall: fields.eventHall?.trim() || undefined,
      category: classify(labels, title, { fallback: 'exhibition' }),
      sourceCategories: labels,
      image: event.featuredImage?.node?.sourceUrl ?? undefined,
      url: `${CALENDAR}/${event.slug}`,
      source: { name: 'BITEC Bangna (bitec.co.th)', url: CALENDAR, fetchedAt },
    }
  })
}
