import { EventBrowser } from '@/components/EventBrowser'
import { venues } from '@/data/venues'
import { allEvents, isUpcoming, toListItem, today } from '@/lib/events'

export const revalidate = 3600

export const metadata = {
  title: 'ปฏิทินงาน',
  description: 'ปฏิทินรวมทุกงานแสดงสินค้า คอนเสิร์ต และการประชุม เรียงตามวันที่จัดจริง',
}

export default function CalendarPage() {
  const day = today()
  const upcoming = allEvents.filter((event) => isUpcoming(event, day))
  const venueCount = new Set(upcoming.map((event) => event.venueId)).size

  return (
    <>
      <header className="shell page-head page-head--tight">
        <h1>ปฏิทินงานทั้งหมด</h1>
        <p>
          {upcoming.length} งานจาก {venueCount} สถานที่ เรียงตามวันที่จัดจริง
          ค้นหาหรือกรองตามสถานที่ ประเภท และเดือนได้
        </p>
      </header>
      <EventBrowser events={upcoming.map(toListItem)} venues={venues} today={day} />
    </>
  )
}
