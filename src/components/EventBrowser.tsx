'use client'

import { useMemo, useState } from 'react'
import { EventRail } from '@/components/EventRail'
import { venuesById } from '@/data/venues'
import { CATEGORY_LABELS } from '@/lib/events'
import { monthTitle } from '@/lib/date'
import type { EventCategory, EventRecord, Venue } from '@/lib/types'

interface Props {
  events: EventRecord[]
  venues: Venue[]
  today: string
}

const ALL = ''

function matchesQuery(event: EventRecord, query: string) {
  if (!query) return true
  // Category and venue names are searchable too, so "คอนเสิร์ต" or "ไบเทค" behave as people expect.
  const venue = venuesById.get(event.venueId)
  const haystack = [
    event.title,
    event.titleTh,
    event.hall,
    event.summary,
    event.category,
    CATEGORY_LABELS[event.category],
    venue?.name,
    venue?.shortName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function EventBrowser({ events, venues, today }: Props) {
  const [query, setQuery] = useState('')
  const [venueId, setVenueId] = useState(ALL)
  const [category, setCategory] = useState(ALL)
  const [month, setMonth] = useState(ALL)

  const months = useMemo(
    () => [...new Set(events.map((event) => event.startDate.slice(0, 7)))].sort(),
    [events]
  )

  const categories = useMemo(
    () => [...new Set(events.map((event) => event.category))].sort(),
    [events]
  )

  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (!venueId || event.venueId === venueId) &&
          (!category || event.category === category) &&
          (!month || event.startDate.slice(0, 7) === month) &&
          matchesQuery(event, query)
      ),
    [events, venueId, category, month, query]
  )

  const isFiltered = Boolean(query || venueId || category || month)

  const reset = () => {
    setQuery('')
    setVenueId(ALL)
    setCategory(ALL)
    setMonth(ALL)
  }

  return (
    <>
      <div className="filters">
        <div className="shell filters__inner">
          <div className="field">
            <label className="skip-link" htmlFor="q">
              ค้นหางาน
            </label>
            <input
              id="q"
              type="search"
              value={query}
              placeholder="ค้นชื่องาน เช่น METALEX, คอนเสิร์ต"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="field">
            <label className="skip-link" htmlFor="venue">
              สถานที่
            </label>
            <select id="venue" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
              <option value={ALL}>ทุกสถานที่</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="skip-link" htmlFor="category">
              ประเภทงาน
            </label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value={ALL}>ทุกประเภท</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value as EventCategory]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="skip-link" htmlFor="month">
              เดือน
            </label>
            <select id="month" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value={ALL}>ทุกเดือน</option>
              {months.map((value) => (
                <option key={value} value={value}>
                  {monthTitle(value)}
                </option>
              ))}
            </select>
          </div>

          {isFiltered ? (
            <button type="button" className="filters__reset" onClick={reset}>
              ล้างตัวกรอง
            </button>
          ) : null}

          <p className="filters__count" aria-live="polite">
            {filtered.length} จาก {events.length} งาน
          </p>
        </div>
      </div>

      <div className="shell">
        <EventRail events={filtered} today={today} />
      </div>
    </>
  )
}
