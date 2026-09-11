import type { MetadataRoute } from 'next'
import { venues } from '@/data/venues'
import { CATEGORY_ORDER, allEvents, generatedAt, isUpcoming, today } from '@/lib/events'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(generatedAt)
  const day = today()

  return [
    { url: SITE, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/calendar`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/venues`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    ...CATEGORY_ORDER.filter((category) => allEvents.some((event) => event.category === category)).map(
      (category) => ({
        url: `${SITE}/category/${category}`,
        lastModified,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })
    ),
    { url: `${SITE}/sources`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    ...venues.map((venue) => ({
      url: `${SITE}/venues/${venue.id}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...allEvents
      .filter((event) => isUpcoming(event, day))
      .map((event) => ({
        url: `${SITE}/events/${encodeURIComponent(event.slug)}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
  ]
}
