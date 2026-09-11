export type EventCategory =
  | 'exhibition'
  | 'concert'
  | 'conference'
  | 'festival'
  | 'sport'
  | 'fair'
  | 'other'

export type OrganizerSector = 'private' | 'government' | 'mixed'

/** One event, normalised across every official source. */
export interface EventRecord {
  /** `${venueId}--${slug}` — stable across re-scrapes. */
  id: string
  slug: string
  title: string
  /** Thai title when the source publishes one separately from `title`. */
  titleTh?: string
  /** Plain-text excerpt of `contentHtml`, for search and meta tags. */
  summary?: string
  /** The venue's full write-up, as sanitised HTML (see src/lib/sanitize.ts). */
  contentHtml?: string
  /** Opening hours or show time exactly as the venue prints it, e.g. "10:00-20:00". */
  time?: string
  /** The event's own site or registration page, when the venue links one. */
  website?: string
  /** ISO date, Asia/Bangkok. Single-day events repeat the date in `endDate`. */
  startDate: string
  endDate: string
  venueId: string
  hall?: string
  category: EventCategory
  /** Category labels exactly as the venue publishes them. */
  sourceCategories: string[]
  image?: string
  /** Canonical page on the venue's own site. */
  url: string
  price?: string
  source: SourceRef
}

export interface SourceRef {
  /** Venue or agency that publishes the listing. */
  name: string
  /** The exact page or endpoint the record was read from. */
  url: string
  /** ISO timestamp of the scrape. */
  fetchedAt: string
}

export interface Venue {
  id: string
  name: string
  nameEn: string
  shortName: string
  province: string
  region: 'bangkok' | 'central' | 'north' | 'northeast' | 'east' | 'south' | 'west'
  address?: string
  website: string
  /** Which page the scraper reads. */
  calendarUrl?: string
  sector: OrganizerSector
  /** Largest usable indoor area, m². Published by the venue. */
  areaSqm?: number
  halls?: string[]
  mapUrl?: string
}

export interface EventDataset {
  generatedAt: string
  sources: { name: string; url: string; events: number }[]
  events: EventRecord[]
}
