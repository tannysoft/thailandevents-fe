import type { Metadata } from 'next'
import Link from 'next/link'
import { Anuphan } from 'next/font/google'
import { generatedAt } from '@/lib/events'
import './globals.css'

const anuphan = Anuphan({
  variable: '--font-anuphan',
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Thailand Events — ปฏิทินอีเวนต์ นิทรรศการ และคอนเสิร์ตทั่วประเทศ',
    template: '%s — Thailand Events',
  },
  description:
    'ปฏิทินรวมงานแสดงสินค้า นิทรรศการ ประชุมสัมมนา และคอนเสิร์ตในประเทศไทย ดึงข้อมูลจากเว็บไซต์ทางการของแต่ละสถานที่โดยตรง',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const updated = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(generatedAt))

  return (
    <html lang="th" className={anuphan.variable}>
      <body>
        <a className="skip-link" href="#main">
          ข้ามไปเนื้อหาหลัก
        </a>

        <header className="masthead">
          <div className="shell masthead__inner">
            <Link className="wordmark" href="/">
              Thailand Events
            </Link>
            <nav aria-label="เมนูหลัก">
              <Link href="/calendar">ปฏิทิน</Link>
              <Link href="/category/concert">คอนเสิร์ต</Link>
              <Link href="/category/exhibition">งานแสดงสินค้า</Link>
              <Link href="/category/conference">ประชุม/สัมมนา</Link>
              <Link href="/venues">สถานที่</Link>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="footer">
          <div className="shell footer__inner">
            <p style={{ margin: 0 }}>
              ข้อมูลดึงจากปฏิทินทางการของแต่ละสถานที่ · อัปเดตล่าสุด {updated}
            </p>
            <p style={{ margin: 0 }}>
              <Link href="/sources">ที่มาของข้อมูลทั้งหมด</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
