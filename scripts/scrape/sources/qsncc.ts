import { getHtml, getJson } from '../lib/http'
import { classify, excerpt, normalizeTitle, slugify } from '../lib/text'
import { sanitizeEventHtml } from '../../../src/lib/sanitize'
import type { EventRecord } from '../../../src/lib/types'

const CALENDAR = 'https://www.qsncc.com/th/whats-on/event-calendar/'

interface PrismicSpan { type: string; start: number; end: number; data?: { url?: string } }
interface PrismicText { type?: string; text?: string; spans?: PrismicSpan[]; url?: string; alt?: string }
interface PrismicWebLink { url?: string }
interface PrismicMediaItem { internalMedia?: { kind?: string; url?: string } }
interface PrismicLinkDoc { data?: { description?: string } }

interface QsnccEvent {
  uid: string
  data: {
    title: string
    description?: PrismicText[]
    media?: PrismicMediaItem[]
    location?: string
    floor?: PrismicLinkDoc
    link?: PrismicWebLink
    startDate2?: string
    endDate2?: string
  }
}

interface CalendarProps {
  pageProps: { calendarEvents: { results: QsnccEvent[] } }
}

const day = (value?: string) => (value ? value.slice(0, 10) : '')

/** First uploaded image. Prismic's URL carries a doubled query string; the bare path is the original. */
function posterUrl(media: PrismicMediaItem[] | undefined): string | undefined {
  const item = media?.find((entry) => entry.internalMedia?.kind === 'image' && entry.internalMedia.url)
  return item?.internalMedia?.url?.split('?')[0]
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const SPAN_TAGS: Record<string, (span: PrismicSpan) => [string, string] | null> = {
  strong: () => ['<strong>', '</strong>'],
  em: () => ['<em>', '</em>'],
  hyperlink: (span) => (span.data?.url ? [`<a href="${escapeHtml(span.data.url)}">`, '</a>'] : null),
}

/** Applies Prismic's inline spans (bold, italic, links) to one block of text. */
function renderSpans(text: string, spans: PrismicSpan[] = []): string {
  const opens = new Map<number, string[]>()
  const closes = new Map<number, string[]>()
  for (const span of spans) {
    const tags = SPAN_TAGS[span.type]?.(span)
    if (!tags) continue
    opens.set(span.start, [...(opens.get(span.start) ?? []), tags[0]])
    closes.set(span.end, [tags[1], ...(closes.get(span.end) ?? [])])
  }

  let html = ''
  for (let index = 0; index <= text.length; index++) {
    html += (closes.get(index) ?? []).join('') + (opens.get(index) ?? []).join('')
    if (index < text.length) html += escapeHtml(text[index])
  }
  return html.replace(/\n/g, '<br>')
}

/** Serialises Prismic rich text the way qsncc.com renders it, grouping list items. */
function renderRichText(blocks: PrismicText[]): string {
  let html = ''
  let openList: 'ul' | 'ol' | null = null

  for (const block of blocks) {
    const listTag = block.type === 'list-item' ? 'ul' : block.type === 'o-list-item' ? 'ol' : null
    if (openList && listTag !== openList) {
      html += `</${openList}>`
      openList = null
    }
    if (listTag && !openList) {
      html += `<${listTag}>`
      openList = listTag
    }

    const inner = renderSpans(block.text ?? '', block.spans)
    if (listTag) html += `<li>${inner}</li>`
    else if (block.type === 'image' && block.url) html += `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt ?? '')}">`
    else if (block.type?.startsWith('heading')) html += `<h3>${inner}</h3>`
    else html += `<p>${inner}</p>`
  }

  if (openList) html += `</${openList}>`
  return html
}

/**
 * QSNCC runs Next.js over Prismic. The Prismic API itself is token-gated, so we read
 * the same payload the venue serves to browsers via its own `_next/data` route.
 */
export async function scrapeQsncc(fetchedAt: string): Promise<EventRecord[]> {
  const html = await getHtml(CALENDAR)
  const embedded = /id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s.exec(html)
  if (!embedded) throw new Error('QSNCC: __NEXT_DATA__ not found')

  const bootstrap = JSON.parse(embedded[1]) as { buildId: string } & CalendarProps
  let results = bootstrap.pageProps?.calendarEvents?.results

  if (!results) {
    const data = await getJson<CalendarProps>(
      `https://www.qsncc.com/_next/data/${bootstrap.buildId}/th/whats-on/event-calendar.json`
    )
    results = data.pageProps.calendarEvents.results
  }

  return results.map((event): EventRecord => {
    const { data } = event
    const blocks = data.description ?? []
    const paragraphs = blocks.map((block) => block.text?.trim() ?? '').filter(Boolean)
    const summary = excerpt(paragraphs)
    const contentHtml = sanitizeEventHtml(renderRichText(blocks), 'https://www.qsncc.com') || undefined
    const title = normalizeTitle(data.title)
    const startDate = day(data.startDate2)
    const floor = data.floor?.data?.description
    const hall = [data.location, floor].filter(Boolean).join(', ') || undefined

    return {
      id: `qsncc--${event.uid}`,
      slug: `qsncc-${slugify(title) || event.uid}`,
      title,
      summary,
      contentHtml,
      website: data.link?.url,
      startDate,
      endDate: day(data.endDate2) || startDate,
      venueId: 'qsncc',
      hall: hall === 'QSNCC' ? undefined : hall,
      category: classify([], title, { summary, fallback: 'exhibition' }),
      sourceCategories: [],
      image: posterUrl(data.media),
      url: `${CALENDAR}${event.uid}`,
      source: { name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (qsncc.com)', url: CALENDAR, fetchedAt },
    }
  })
}
