import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventGrid } from '@/components/EventGrid'
import { venues, venuesById } from '@/data/venues'
import { allEvents, isUpcoming, today } from '@/lib/events'

export const revalidate = 3600

export function generateStaticParams() {
  return venues.map((venue) => ({ venueId: venue.id }))
}

export async function generateMetadata({ params }: PageProps<'/venues/[venueId]'>) {
  const { venueId } = await params
  const venue = venuesById.get(venueId)
  return venue ? { title: venue.name, description: `ปฏิทินงานที่ ${venue.name}` } : {}
}

export default async function VenuePage({ params }: PageProps<'/venues/[venueId]'>) {
  const { venueId } = await params
  const venue = venuesById.get(venueId)
  if (!venue) notFound()

  const day = today()
  const events = allEvents.filter((event) => event.venueId === venue.id && isUpcoming(event, day))

  return (
    <div className="shell" style={{ ['--venue' as string]: `var(--venue-${venue.id}, var(--venue-default))` }}>
      <header className="page-head">
        <nav className="crumbs" aria-label="เส้นทาง">
          <Link href="/">หน้าแรก</Link>
          <span aria-hidden="true">/</span>
          <Link href="/venues">สถานที่</Link>
        </nav>
        <h1 className="venue-title">{venue.name}</h1>
        <p>
          {venue.nameEn}
          {venue.address ? ` · ${venue.address}` : ''}
        </p>
      </header>

      <dl className="facts" style={{ marginTop: '1.75rem' }}>
        <div>
          <dt>งานที่ประกาศไว้</dt>
          <dd>{events.length} งาน</dd>
        </div>
        {venue.halls && venue.halls.length > 0 && (
          <div>
            <dt>ฮอลล์</dt>
            <dd>{venue.halls.join(' · ')}</dd>
          </div>
        )}
        {venue.areaSqm && (
          <div>
            <dt>พื้นที่จัดงาน</dt>
            <dd>{venue.areaSqm.toLocaleString('th-TH')} ตารางเมตร</dd>
          </div>
        )}
        <div>
          <dt>ปฏิทินทางการ</dt>
          <dd>
            <a href={venue.calendarUrl ?? venue.website} target="_blank" rel="noreferrer">
              {(venue.calendarUrl ?? venue.website).replace(/^https?:\/\//, '')}
            </a>
          </dd>
        </div>
      </dl>

      <EventGrid events={events} today={day} />
    </div>
  )
}
