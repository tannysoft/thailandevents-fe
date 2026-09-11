import Link from 'next/link'
import { CATEGORY_LABELS, daysBetween, groupByMonth, isLive, venueOf } from '@/lib/events'
import { formatRange, monthTitle, railDays, shortMonth } from '@/lib/date'
import type { EventRecord } from '@/lib/types'

interface Props {
  events: EventRecord[]
  today: string
  /** Venue pages already say where they are; hide the repeated chip there. */
  showVenue?: boolean
}

/**
 * The timeline rail. One continuous hairline carries the months down the page and
 * every event hangs off it, painted for the length of its run.
 */
export function EventRail({ events, today, showVenue = true }: Props) {
  if (events.length === 0) {
    return (
      <div className="empty">
        <h2>ไม่พบงานที่ตรงกับที่เลือก</h2>
        <p>ลองเปลี่ยนคำค้น หรือเลือกสถานที่กับเดือนใหม่</p>
      </div>
    )
  }

  return (
    <div className="rail">
      {groupByMonth(events).map(({ month, events: monthEvents }) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <header className="rail__month">
            <h2 id={`month-${month}`}>{monthTitle(month)}</h2>
            <span>{monthEvents.length} งาน</span>
          </header>
          {monthEvents.map((event) => (
            <RailEntry key={event.id} event={event} today={today} showVenue={showVenue} />
          ))}
        </section>
      ))}
    </div>
  )
}

function RailEntry({
  event,
  today,
  showVenue,
}: {
  event: EventRecord
  today: string
  showVenue: boolean
}) {
  const venue = venueOf(event)
  const live = isLive(event, today)
  const multiDay = event.endDate > event.startDate
  const daysLeft = daysBetween(today, event.endDate)
  const startsIn = daysBetween(today, event.startDate)
  // The rail column already reads "14–17 ก.ย."; spell the range out only when a run
  // crosses a month boundary and the short form would be ambiguous.
  const crossesMonth = event.startDate.slice(0, 7) !== event.endDate.slice(0, 7)

  const className = ['entry', multiDay && 'entry--run', live && 'entry--live']
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={className}
      style={{ ['--venue' as string]: `var(--venue-${event.venueId}, var(--venue-default))` }}
    >
      <div className="entry__when">
        <span className="entry__days">{railDays(event.startDate, event.endDate)}</span>
        <span className="entry__month">{shortMonth(event.startDate)}</span>
      </div>
      <div className="entry__body">
        <h3 className="entry__title">
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h3>
        {event.titleTh && <p className="entry__alt">{event.titleTh}</p>}
        <p className="entry__meta">
          {live && <span className="flag">กำลังจัด</span>}
          {!live && startsIn >= 0 && startsIn <= 7 && (
            <span className="flag">{startsIn === 0 ? 'เริ่มวันนี้' : `อีก ${startsIn} วัน`}</span>
          )}
          {showVenue && venue && (
            <Link className="venue-chip" href={`/venues/${venue.id}`}>
              {venue.name}
            </Link>
          )}
          {event.hall && !showVenue && <span>{event.hall}</span>}
          {crossesMonth && <span>{formatRange(event.startDate, event.endDate)}</span>}
          <span className="tag">{CATEGORY_LABELS[event.category]}</span>
          {live && multiDay && daysLeft > 0 && <span>เหลืออีก {daysLeft} วัน</span>}
        </p>
      </div>
    </article>
  )
}
