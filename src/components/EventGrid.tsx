import { EventCard } from '@/components/EventCard'
import { groupByMonth } from '@/lib/events'
import { monthTitle } from '@/lib/date'
import type { EventRecord } from '@/lib/types'

/** Poster cards grouped under month headings, for category and venue pages. */
export function EventGrid({ events, today }: { events: EventRecord[]; today: string }) {
  if (events.length === 0) {
    return (
      <div className="empty">
        <h2>ยังไม่มีงานที่ประกาศไว้</h2>
        <p>สถานที่ยังไม่ได้ลงปฏิทินล่วงหน้า ลองดูปฏิทินรวมของทุกสถานที่แทน</p>
      </div>
    )
  }

  return (
    <>
      {groupByMonth(events).map(({ month, events: monthEvents }) => (
        <section key={month} className="section section--month" aria-labelledby={`month-${month}`}>
          <header className="section-head section-head--month">
            <h2 id={`month-${month}`}>{monthTitle(month)}</h2>
            <span>{monthEvents.length} งาน</span>
          </header>
          <div className="grid">
            {monthEvents.map((event) => (
              <EventCard key={event.id} event={event} today={today} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
