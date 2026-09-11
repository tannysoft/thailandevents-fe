import Image from 'next/image'
import Link from 'next/link'
import { CATEGORY_LABELS, isLive, venueOf } from '@/lib/events'
import { dayOfMonth, formatRange, railDays, shortMonth } from '@/lib/date'
import type { EventRecord } from '@/lib/types'

type Variant = 'lead' | 'card' | 'row'

interface Props {
  event: EventRecord
  today: string
  variant?: Variant
  /** Set on the one image that paints above the fold. */
  priority?: boolean
}

const IMAGE_SIZES: Record<Variant, string> = {
  lead: '(max-width: 40rem) 100vw, (max-width: 56rem) 50vw, 26rem',
  card: '(max-width: 34rem) 90vw, (max-width: 64rem) 33vw, 17rem',
  row: '6rem',
}

/**
 * One event as a poster card. The whole card is a single link (the title stretches over
 * it); the date sits on the artwork like a ticket stub, underlined in the venue's colour.
 */
export function EventCard({ event, today, variant = 'card', priority = false }: Props) {
  const venue = venueOf(event)
  const live = isLive(event, today)
  const sameMonth = event.startDate.slice(0, 7) === event.endDate.slice(0, 7)
  const href = `/events/${event.slug}`
  const Heading = variant === 'lead' ? 'h2' : 'h3'

  return (
    <article
      className={`card card--${variant}`}
      style={{ ['--venue' as string]: `var(--venue-${event.venueId}, var(--venue-default))` }}
    >
      <div className="card__media">
        {event.image ? (
          <Image src={event.image} alt="" fill sizes={IMAGE_SIZES[variant]} priority={priority} />
        ) : (
          <span className="card__placeholder">{venue?.shortName}</span>
        )}
        {variant !== 'row' && (
          <span className="card__date">
            <strong>{sameMonth ? railDays(event.startDate, event.endDate) : dayOfMonth(event.startDate)}</strong>
            <span>{shortMonth(event.startDate)}</span>
          </span>
        )}
      </div>

      <div className="card__body">
        <Heading className="card__title">
          <Link href={href}>{event.title}</Link>
        </Heading>
        <p className="card__meta">
          {live && <span className="flag">กำลังจัด</span>}
          {venue && <span className="venue-chip">{venue.name}</span>}
          {(variant === 'row' || !sameMonth) && <span>{formatRange(event.startDate, event.endDate)}</span>}
          {variant === 'lead' && <span className="tag">{CATEGORY_LABELS[event.category]}</span>}
        </p>
        {variant !== 'row' && event.summary && <p className="card__excerpt">{event.summary}</p>}
        {variant === 'lead' && (
          <Link className="button card__cta" href={href}>
            อ่านรายละเอียดงาน
          </Link>
        )}
      </div>
    </article>
  )
}
