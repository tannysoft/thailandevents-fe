# Thailand Events

ปฏิทินรวมงานแสดงสินค้า คอนเสิร์ต และการประชุมในฮอลล์ใหญ่ทั่วไทย
ข้อมูลทุกงานอ่านตรงจากปฏิทินทางการของเจ้าของสถานที่ ไม่ได้คัดลอกจากเว็บรวมงานอื่น

## เริ่มใช้งาน

```bash
npm install
npm run scrape   # ดึงข้อมูลล่าสุดจากเว็บทางการ → src/data/events.json
npm run dev      # http://localhost:3000
npm run build    # สร้างเว็บแบบ static ทั้งหมด
```

ตั้ง `NEXT_PUBLIC_SITE_URL` เป็นโดเมนจริงก่อน build เพื่อให้ `sitemap.xml` และ `robots.txt` ชี้ถูกที่

## แหล่งข้อมูล (official เท่านั้น)

| สถานที่ | หน้าที่อ่าน | วิธีดึง |
| --- | --- | --- |
| ไบเทค บางนา (BITEC) | `bitec.co.th/api/content/events` | JSON API ของเว็บ BITEC เอง อ่านทั้งไทย/อังกฤษ รายละเอียดงานอ่านจาก WordPress REST ที่เป็นหลังบ้านของ bitec.co.th |
| ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC) | `qsncc.com/th/whats-on/event-calendar/` | ข้อมูล `__NEXT_DATA__` ที่เว็บส่งให้เบราว์เซอร์ (มีรายละเอียดงานในชุดเดียวกัน) |
| IMPACT เมืองทองธานี (Arena, Challenger, Forum, Thunder Dome, Exhibition) | `impact.co.th/th/visitors/event-calendar` | อ่าน HTML ทีละเดือน ทั้งไทย/อังกฤษ แล้วเปิดหน้าแต่ละงานเพื่ออ่านรายละเอียด เวลา ฮอลล์ ผู้จัด |
| UOB Live (EmSphere) | `uoblive.asia/whats-on` | อ่านรายการ Webflow CMS แล้วเปิดหน้าแต่ละงานเพื่ออ่านรายละเอียด |

ทุก record เก็บ `source.url` และ `source.fetchedAt` ไว้ และหน้ารายละเอียดงานมีปุ่มกลับไปหน้าต้นทางเสมอ

## โครงสร้าง

```
scripts/scrape/
  index.ts            รันทุกแหล่ง รวม ตัดซ้ำ แล้วเขียน src/data/events.json
  sources/*.ts        ตัวดึงข้อมูล 1 ไฟล์ต่อ 1 สถานที่
  lib/                http (retry + throttle), แปลงวันที่ไทย/พ.ศ., จัดหมวดหมู่
src/
  data/venues.ts      ทะเบียนสถานที่ + ลิงก์ปฏิทินทางการ
  data/events.json    ไฟล์ที่ scraper สร้าง (commit ไว้เพื่อดูประวัติได้จาก git)
  app/                หน้าเว็บ: ปฏิทิน, รายละเอียดงาน, สถานที่, แหล่งข้อมูล
```

## เพิ่มสถานที่ใหม่

1. เพิ่มข้อมูลสถานที่ใน `src/data/venues.ts` (ใส่ `calendarUrl` เป็นหน้าเว็บทางการ)
2. เขียน `scripts/scrape/sources/<venue>.ts` ที่คืนค่า `EventRecord[]`
3. ลงทะเบียนใน `SOURCES` ของ `scripts/scrape/index.ts`
4. เพิ่มสีประจำสถานที่ `--venue-<id>` ใน `src/app/globals.css`

ถ้าแหล่งใดล่มระหว่างรัน ตัวดึงจะข้ามแหล่งนั้นแล้วรันแหล่งอื่นต่อ (ดูสรุปจำนวนต่อแหล่งในหน้า `/sources`)

## ข้อควรรู้

- ปฏิทินของสถานที่ประกาศเฉพาะงานที่จองฮอลล์แล้ว
- IMPACT กับ UOB Live ต้องเปิดหน้ารายละเอียดทีละงาน การรัน `npm run scrape` จึงใช้เวลาราวหนึ่งนาที
- ถ้าเปิดหน้ารายละเอียดงานใดไม่ได้ งานนั้นยังอยู่ในปฏิทินแต่จะไม่มีคำอธิบาย
- รายละเอียดงานเก็บเนื้อหาเต็มตามต้นฉบับเป็น HTML (หัวข้อ ลิสต์ ลิงก์ รูป วิดีโอ YouTube) ผ่าน allowlist ใน `src/lib/sanitize.ts` ทั้งตอนดึงและตอนแสดงผล สคริปต์ สไตล์ และ iframe จากโดเมนอื่นจะถูกตัดออก
- QSNCC ไม่ได้ติดหมวดงาน ระบบจึงเดาจากชื่อและคำอธิบายงาน
