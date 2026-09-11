import { enrichEach, getHtml } from '../lib/http'
import { classify, excerpt, htmlToParagraphs, normalizeTitle, parseEnglishDate, slugify } from '../lib/text'
import { sanitizeEventHtml } from '../../../src/lib/sanitize'
import type { EventRecord } from '../../../src/lib/types'

const ORIGIN = 'https://uoblive.asia'
const CALENDAR = `${ORIGIN}/whats-on`

/** Webflow renders each listing as one `w-dyn-item`, with its fields in hidden divs. */
const ITEM = '<div role="listitem" class="event-list-content-item w-dyn-item">'

const field = (block: string, name: string) =>
  new RegExp(`fs-list-field="${name}">([^<]+)`).exec(block)?.[1]?.trim()

/** The show write-up is one Webflow rich-text article, kept whole: links, schedule, trailer. */
function parseDetail(html: string): string {
  const start = html.indexOf('class="text-rich-text w-richtext"')
  if (start === -1) return ''
  const from = html.indexOf('>', start) + 1
  const close = html.indexOf('</article>', from)
  return sanitizeEventHtml(html.slice(from, close === -1 ? from + 12_000 : close), ORIGIN)
}

export async function scrapeUobLive(fetchedAt: string): Promise<EventRecord[]> {
  const html = await getHtml(CALENDAR)
  const events: EventRecord[] = []

  for (const block of html.split(ITEM).slice(1)) {
    const path = /href="(\/event\/[^"]+)"/.exec(block)?.[1]
    const rawTitle = /class="[^"]*(?:title|heading)[^"]*"[^>]*>([^<]{3,160})</.exec(block)?.[1]
    const date = parseEnglishDate(field(block, 'event-date') ?? '')
    if (!path || !rawTitle || !date) continue

    const title = normalizeTitle(rawTitle)
    const label = field(block, 'category') ?? ''
    const slug = path.split('/').pop() ?? slugify(title)

    events.push({
      id: `uoblive--${slug}`,
      slug: `uoblive-${slugify(title) || slug}`,
      title,
      // UOB Live lists a single show date per entry.
      startDate: date,
      endDate: date,
      venueId: 'uob-live',
      // "Other Event Types" covers comedy and talks; only unlabelled shows default to concert.
      category: /other/i.test(label) ? 'other' : classify([label], title, { fallback: 'concert' }),
      sourceCategories: label ? [label] : [],
      image: /src="(https:\/\/cdn[^"]+)"/.exec(block)?.[1],
      url: new URL(path, ORIGIN).href,
      source: { name: 'UOB Live (uoblive.asia)', url: CALENDAR, fetchedAt },
    })
  }

  await enrichEach(events, async (event) => {
    const contentHtml = parseDetail(await getHtml(event.url))
    event.contentHtml = contentHtml || undefined
    event.summary = excerpt(htmlToParagraphs(contentHtml))
  })

  return events
}
