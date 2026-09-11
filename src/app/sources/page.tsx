import { venues } from '@/data/venues'
import { generatedAt, sourceSummary } from '@/lib/events'

export const metadata = {
  title: 'แหล่งข้อมูล',
  description: 'รายการเว็บไซต์ทางการที่เว็บนี้ดึงข้อมูลงานมา และวิธีตรวจสอบย้อนกลับ',
}

export default function SourcesPage() {
  const updated = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(generatedAt))

  return (
    <div className="shell">
      <header className="page-head">
        <h1>แหล่งข้อมูล</h1>
        <p>
          ทุกงานบนเว็บนี้อ่านมาจากปฏิทินทางการของเจ้าของสถานที่เอง ไม่ได้คัดลอกต่อจากเว็บรวมงานอื่น
          และทุกหน้ารายละเอียดงานมีลิงก์กลับไปหน้าต้นทางเสมอ
        </p>
      </header>

      <div className="prose">
        <h2>ปฏิทินที่ดึงข้อมูลมา</h2>
        <ul>
          {sourceSummary.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>{' '}
              — {source.events} งาน
            </li>
          ))}
        </ul>

        <h2>วิธีที่ดึงมา</h2>
        <p>
          ตัวดึงข้อมูลอยู่ใน <code>scripts/scrape</code> แยกไฟล์ตามแต่ละสถานที่ สั่งรันด้วย{' '}
          <code>npm run scrape</code> ผลลัพธ์เขียนลง <code>src/data/events.json</code>{' '}
          เป็นไฟล์เดียวที่หน้าเว็บอ่าน จึงตรวจสอบความเปลี่ยนแปลงย้อนหลังได้จาก git
        </p>
        <ul>
          <li>
            BITEC เปิด API ปฏิทินของตัวเองเป็น JSON อ่านได้ทั้งภาษาไทยและอังกฤษ
            ส่วนรายละเอียดงานอ่านจาก WordPress ที่เป็นระบบหลังบ้านของเว็บ bitec.co.th
          </li>
          <li>
            ศูนย์การประชุมแห่งชาติสิริกิติ์ ใช้ Next.js ต่อกับ Prismic
            จึงอ่านชุดข้อมูลเดียวกับที่เว็บส่งให้เบราว์เซอร์ รวมถึงรายละเอียดงาน
          </li>
          <li>
            IMPACT เมืองทองธานี เป็นปฏิทิน Joomla อ่านทีละเดือนทั้งฉบับไทยและอังกฤษ
            แล้วเปิดหน้าของแต่ละงานเพื่ออ่านรายละเอียด เวลา ฮอลล์ และผู้จัดงาน
          </li>
          <li>UOB Live อ่านรายการจากหน้า whats-on แล้วเปิดหน้าของแต่ละงานเพื่ออ่านรายละเอียด</li>
        </ul>

        <h2>สถานที่ที่ติดตามอยู่</h2>
        <ul>
          {venues.map((venue) => (
            <li key={venue.id}>
              {venue.name} ({venue.nameEn}) — {venue.province} ·{' '}
              <a href={venue.calendarUrl ?? venue.website} target="_blank" rel="noreferrer">
                ปฏิทินทางการ
              </a>
            </li>
          ))}
        </ul>

        <h2>ข้อจำกัดที่ควรรู้</h2>
        <p>
          ปฏิทินของสถานที่ประกาศเฉพาะงานที่จองฮอลล์แล้ว งานที่ยังไม่ยืนยันจะยังไม่ปรากฏ
          และสถานที่อาจแก้วันหรือย้ายฮอลล์ภายหลัง ก่อนเดินทางให้ยึดตามประกาศของผู้จัดงานเป็นหลัก
        </p>
        <p>
          รายละเอียดงานคัดมาเต็มตามหน้าต้นทาง ทั้งหัวข้อ ลิสต์ ลิงก์ รูป และวิดีโอ
          โดยกรองออกเฉพาะสคริปต์ สไตล์ และสื่อฝังจากโดเมนที่ไม่รู้จัก
        </p>
        <p>อัปเดตข้อมูลครั้งล่าสุด {updated}</p>
      </div>
    </div>
  )
}
