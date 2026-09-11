import Link from 'next/link'
import { EventCard } from '@/components/EventCard'
import { venues } from '@/data/venues'
import { formatRange } from '@/lib/date'
import {
  CATEGORY_ORDER,
  CATEGORY_TITLES,
  allEvents,
  isUpcoming,
  overlaps,
  pickHighlights,
  thisWeekend,
  today,
} from '@/lib/events'

// "Today" drives the live flags and the weekend shelf; refresh it hourly.
export const revalidate = 3600

const SHELF_SIZE = 4

export default function HomePage() {
  const day = today()
  const upcoming = allEvents.filter((event) => isUpcoming(event, day))
  const { lead, side } = pickHighlights(upcoming, day)
  const featured = new Set([lead, ...side].filter(Boolean).map((event) => event!.id))

  const { saturday, sunday } = thisWeekend(day)
  const weekend = upcoming.filter((event) => overlaps(event, day, sunday))

  const shelves = CATEGORY_ORDER.map((category) => {
    const all = upcoming.filter((event) => event.category === category)
    return { category, total: all.length, events: all.filter((e) => !featured.has(e.id)).slice(0, SHELF_SIZE) }
  }).filter((shelf) => shelf.total >= 3)

  const venueCounts = venues
    .map((venue) => ({ venue, count: upcoming.filter((event) => event.venueId === venue.id).length }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <>
      <section className="shell hero" aria-label="งานเด่น">
        {lead && <EventCard event={lead} today={day} variant="lead" priority />}
        <div className="hero__side">
          <h2 className="hero__side-title">ถัดไปในปฏิทิน</h2>
          {side.map((event) => (
            <EventCard key={event.id} event={event} today={day} variant="row" />
          ))}
          <Link className="text-link" href="/calendar">
            ดูปฏิทินทั้งหมด {upcoming.length} งาน
          </Link>
        </div>
      </section>

      {weekend.length > 0 && (
        <section className="board" aria-labelledby="weekend">
          <div className="shell">
            <header className="section-head section-head--board">
              <h2 id="weekend">งานที่ไปได้ภายในสุดสัปดาห์นี้</h2>
              <span>
                {formatRange(saturday, sunday)} · {weekend.length} งาน
              </span>
            </header>
            <div className="strip">
              {weekend.map((event) => (
                <EventCard key={event.id} event={event} today={day} />
              ))}
            </div>
          </div>
        </section>
      )}

      {shelves.map(({ category, total, events }) => (
        <section key={category} className="shell section" aria-labelledby={`shelf-${category}`}>
          <header className="section-head">
            <h2 id={`shelf-${category}`}>{CATEGORY_TITLES[category]}</h2>
            <Link href={`/category/${category}`}>ดูทั้งหมด {total} งาน</Link>
          </header>
          <div className="grid grid--shelf">
            {events.map((event) => (
              <EventCard key={event.id} event={event} today={day} />
            ))}
          </div>
        </section>
      ))}

      <section className="shell section" aria-labelledby="by-venue">
        <header className="section-head">
          <h2 id="by-venue">เลือกดูตามสถานที่</h2>
          <Link href="/venues">สถานที่ทั้งหมด</Link>
        </header>
        <ul className="venue-tiles">
          {venueCounts.map(({ venue, count }) => (
            <li key={venue.id}>
              <Link
                href={`/venues/${venue.id}`}
                style={{ ['--venue' as string]: `var(--venue-${venue.id}, var(--venue-default))` }}
              >
                <span className="venue-tiles__name">{venue.name}</span>
                <span className="venue-tiles__count">{count} งาน</span>
                <span className="venue-tiles__meta">
                  {venue.nameEn} · {venue.province}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="cta-band" aria-labelledby="all-events">
        <div className="shell cta-band__inner">
          <div>
            <h2 id="all-events">ดูครบทุกงานในปฏิทิน</h2>
            <p>
              {upcoming.length} งานเรียงตามวันที่จัดจริง ค้นหาและกรองตามสถานที่ ประเภท หรือเดือนได้
            </p>
          </div>
          <Link className="button button--invert" href="/calendar">
            เปิดปฏิทิน
          </Link>
        </div>
      </section>
    </>
  )
}
