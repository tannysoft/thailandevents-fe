import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventCard } from '@/components/EventCard'
import { venuesById } from '@/data/venues'
import { formatRange } from '@/lib/date'
import {
  CATEGORY_LABELS,
  CATEGORY_TITLES,
  allEvents,
  daysBetween,
  findEvent,
  isLive,
  isUpcoming,
  relatedEvents,
  today,
} from '@/lib/events'
import { sanitizeEventHtml } from '@/lib/sanitize'

export const revalidate = 3600

export function generateStaticParams() {
  return allEvents.map((event) => ({ slug: event.slug }))
}

export async function generateMetadata({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params
  const event = findEvent(decodeURIComponent(slug))
  if (!event) return {}
  const venue = venuesById.get(event.venueId)
  return {
    title: event.title,
    description:
      event.summary ?? `${event.title} · ${formatRange(event.startDate, event.endDate)} · ${venue?.name ?? ''}`,
    openGraph: event.image ? { images: [event.image] } : undefined,
  }
}

export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params
  const event = findEvent(decodeURIComponent(slug))
  if (!event) notFound()

  const venue = venuesById.get(event.venueId)
  // Sanitised again at render: this is the line that injects third-party HTML.
  const contentHtml = event.contentHtml ? sanitizeEventHtml(event.contentHtml) : ''
  const day = today()
  const live = isLive(event, day)
  const startsIn = daysBetween(day, event.startDate)
  const related = relatedEvents(event, allEvents.filter((candidate) => isUpcoming(candidate, day)))
  const fetchedOn = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(event.source.fetchedAt))

  // Search engines and calendar apps read this; keep it in step with the visible page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    alternateName: event.titleTh,
    description: event.summary,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: event.image,
    url: event.url,
    location: venue
      ? {
          '@type': 'Place',
          name: venue.name,
          address: { '@type': 'PostalAddress', streetAddress: venue.address, addressCountry: 'TH' },
          url: venue.website,
        }
      : undefined,
  }

  return (
    <div
      className="shell detail"
      style={{ ['--venue' as string]: `var(--venue-${event.venueId}, var(--venue-default))` }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="crumbs" aria-label="เส้นทาง">
        <Link href="/">หน้าแรก</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/category/${event.category}`}>{CATEGORY_TITLES[event.category]}</Link>
      </nav>

      <h1 className="detail__title">{event.title}</h1>
      {event.titleTh && <p className="detail__alt">{event.titleTh}</p>}
      {event.summary && !event.titleTh && <p className="detail__standfirst">{event.summary}</p>}

      <div className="detail__grid">
        <div>
          <dl className="facts">
            <div>
              <dt>วันจัดงาน</dt>
              <dd>
                {formatRange(event.startDate, event.endDate)}
                {live && ' · กำลังจัดอยู่'}
                {!live && startsIn > 0 && ` · อีก ${startsIn} วัน`}
              </dd>
            </div>
            {event.time && (
              <div>
                <dt>เวลา</dt>
                <dd>{event.time}</dd>
              </div>
            )}
            <div>
              <dt>สถานที่</dt>
              <dd>
                {venue ? (
                  <Link className="venue-chip" href={`/venues/${venue.id}`}>
                    {venue.name}
                  </Link>
                ) : (
                  event.venueId
                )}
                {venue && <div style={{ color: 'var(--ink-soft)' }}>{venue.address}</div>}
              </dd>
            </div>
            {event.hall && (
              <div>
                <dt>ฮอลล์</dt>
                <dd>{event.hall}</dd>
              </div>
            )}
            <div>
              <dt>ประเภท</dt>
              <dd>{CATEGORY_LABELS[event.category]}</dd>
            </div>
            {event.price && (
              <div>
                <dt>บัตร</dt>
                <dd>{event.price}</dd>
              </div>
            )}
          </dl>

          <div className="detail__actions">
            <a className="button" href={event.url} target="_blank" rel="noreferrer">
              ดูหน้างานบนเว็บทางการ
            </a>
            {event.website && (
              <a className="button button--quiet" href={event.website} target="_blank" rel="noreferrer">
                เว็บไซต์ของงาน
              </a>
            )}
            {venue?.mapUrl && (
              <a className="button button--quiet" href={venue.mapUrl} target="_blank" rel="noreferrer">
                เปิดแผนที่
              </a>
            )}
          </div>

          {contentHtml ? (
            <section className="detail__description" aria-labelledby="about">
              <h2 id="about">รายละเอียดงาน</h2>
              <div className="rich" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </section>
          ) : (
            event.summary && <p className="detail__summary">{event.summary}</p>
          )}

          <p className="source-note">
            ข้อมูลนี้อ่านจาก{' '}
            <a href={event.source.url} target="_blank" rel="noreferrer">
              {event.source.name}
            </a>{' '}
            เมื่อ {fetchedOn} · วันและเวลาจริงให้ยึดตามประกาศของผู้จัดงาน
          </p>
        </div>

        {event.image && (
          <div className="detail__media">
            <Image
              className="poster"
              src={event.image}
              alt={`โปสเตอร์งาน ${event.title}`}
              width={800}
              height={1000}
              sizes="(max-width: 48rem) 22rem, 28rem"
              priority
            />
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related">
          <header className="section-head">
            <h2 id="related">งานอื่นที่น่าสนใจ</h2>
            {venue && <Link href={`/venues/${venue.id}`}>งานทั้งหมดที่ {venue.name}</Link>}
          </header>
          <div className="grid grid--shelf">
            {related.map((item) => (
              <EventCard key={item.id} event={item} today={day} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
