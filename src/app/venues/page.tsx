import Link from 'next/link'
import { venues } from '@/data/venues'
import { allEvents, isUpcoming, today } from '@/lib/events'

export const metadata = {
  title: 'สถานที่จัดงาน',
  description: 'ศูนย์ประชุมและฮอลล์ขนาดใหญ่ที่เว็บนี้ติดตามปฏิทินอยู่',
}

export default function VenuesPage() {
  const day = today()
  const upcoming = allEvents.filter((event) => isUpcoming(event, day))

  const rows = venues
    .map((venue) => ({
      venue,
      count: upcoming.filter((event) => event.venueId === venue.id).length,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="shell">
      <header className="page-head">
        <h1>สถานที่จัดงาน</h1>
        <p>
          เว็บนี้ติดตามปฏิทินของ {venues.length} สถานที่ โดยอ่านจากหน้าเว็บทางการของแต่ละแห่งโดยตรง
          จะทยอยเพิ่มศูนย์ประชุมในต่างจังหวัดต่อไป
        </p>
      </header>

      <ul className="venue-list">
        {rows.map(({ venue, count }) => (
          <li key={venue.id}>
            <Link
              className="venue-row"
              href={`/venues/${venue.id}`}
              style={{ ['--venue' as string]: `var(--venue-${venue.id}, var(--venue-default))` }}
            >
              <span className="venue-row__name">{venue.name}</span>
              <span className="venue-row__meta">
                {venue.nameEn} · {venue.province}
                {venue.areaSqm ? ` · พื้นที่จัดงาน ${venue.areaSqm.toLocaleString('th-TH')} ตร.ม.` : ''}
              </span>
              <span className="venue-row__count">{count} งาน</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
