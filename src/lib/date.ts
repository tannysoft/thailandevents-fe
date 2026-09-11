const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const TH_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const parts = (isoDate: string) => isoDate.split('-').map(Number) as [number, number, number]

/** Thai calendars count years in the Buddhist Era: 2026 CE → 2569 BE. */
export const buddhistYear = (year: number) => year + 543

export function dayOfMonth(isoDate: string): string {
  return String(parts(isoDate)[2])
}

export function shortMonth(isoDate: string): string {
  return TH_MONTHS_SHORT[parts(isoDate)[1] - 1]
}

export function monthTitle(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return `${TH_MONTHS_LONG[month - 1]} ${buddhistYear(year)}`
}

/** "14–17 ก.ย. 2569", or "29 ต.ค. – 1 พ.ย. 2569" when a run crosses months. */
export function formatRange(startDate: string, endDate: string): string {
  const [sy, sm, sd] = parts(startDate)
  const [ey, em, ed] = parts(endDate)
  if (startDate === endDate) return `${sd} ${TH_MONTHS_SHORT[sm - 1]} ${buddhistYear(sy)}`
  if (sy === ey && sm === em) return `${sd}–${ed} ${TH_MONTHS_SHORT[sm - 1]} ${buddhistYear(sy)}`
  if (sy === ey) {
    return `${sd} ${TH_MONTHS_SHORT[sm - 1]} – ${ed} ${TH_MONTHS_SHORT[em - 1]} ${buddhistYear(sy)}`
  }
  return `${sd} ${TH_MONTHS_SHORT[sm - 1]} ${buddhistYear(sy)} – ${ed} ${TH_MONTHS_SHORT[em - 1]} ${buddhistYear(ey)}`
}

/** Compact rail label: the day number, or the day span for a multi-day run. */
export function railDays(startDate: string, endDate: string): string {
  const [, sm, sd] = parts(startDate)
  const [, em, ed] = parts(endDate)
  if (startDate === endDate) return String(sd)
  if (sm === em) return `${sd}–${ed}`
  return `${sd}–${ed}`
}
