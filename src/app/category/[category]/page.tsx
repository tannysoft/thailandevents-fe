import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventGrid } from '@/components/EventGrid'
import {
  CATEGORY_ORDER,
  CATEGORY_TITLES,
  allEvents,
  isEventCategory,
  isUpcoming,
  today,
} from '@/lib/events'

export const revalidate = 3600
export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORY_ORDER.filter((category) => allEvents.some((event) => event.category === category)).map(
    (category) => ({ category })
  )
}

export async function generateMetadata({ params }: PageProps<'/category/[category]'>) {
  const { category } = await params
  if (!isEventCategory(category)) return {}
  return { title: CATEGORY_TITLES[category], description: `${CATEGORY_TITLES[category]}ที่กำลังจะจัดในไทย` }
}

export default async function CategoryPage({ params }: PageProps<'/category/[category]'>) {
  const { category } = await params
  if (!isEventCategory(category)) notFound()

  const day = today()
  const events = allEvents.filter((event) => event.category === category && isUpcoming(event, day))
  const venueCount = new Set(events.map((event) => event.venueId)).size

  return (
    <div className="shell">
      <header className="page-head">
        <nav className="crumbs" aria-label="เส้นทาง">
          <Link href="/">หน้าแรก</Link>
          <span aria-hidden="true">/</span>
          <span>{CATEGORY_TITLES[category]}</span>
        </nav>
        <h1>{CATEGORY_TITLES[category]}</h1>
        <p>
          {events.length} งานจาก {venueCount} สถานที่ เรียงตามวันที่จัด
        </p>
      </header>
      <EventGrid events={events} today={day} />
    </div>
  )
}
