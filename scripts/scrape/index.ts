import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scrapeBitec } from './sources/bitec'
import { scrapeImpact } from './sources/impact'
import { scrapeQsncc } from './sources/qsncc'
import { scrapeUobLive } from './sources/uoblive'
import type { EventDataset, EventRecord } from '../../src/lib/types'

const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/data/events.json')

const SOURCES = [
  { name: 'BITEC Bangna', url: 'https://www.bitec.co.th/whats-on', run: scrapeBitec },
  { name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์', url: 'https://www.qsncc.com/th/whats-on/event-calendar/', run: scrapeQsncc },
  { name: 'IMPACT เมืองทองธานี', url: 'https://www.impact.co.th/th/visitors/event-calendar', run: scrapeImpact },
  { name: 'UOB Live', url: 'https://uoblive.asia/whats-on', run: scrapeUobLive },
]

function isUsable(event: EventRecord): boolean {
  return Boolean(event.title && /^\d{4}-\d{2}-\d{2}$/.test(event.startDate))
}

async function main() {
  const fetchedAt = new Date().toISOString()
  const events: EventRecord[] = []
  const summary: EventDataset['sources'] = []

  for (const source of SOURCES) {
    process.stdout.write(`→ ${source.name} … `)
    try {
      const found = (await source.run(fetchedAt)).filter(isUsable)
      events.push(...found)
      summary.push({ name: source.name, url: source.url, events: found.length })
      const described = found.filter((event) => event.contentHtml).length
      console.log(`${found.length} events, ${described} with descriptions`)
    } catch (error) {
      // One venue being down must not throw away the rest of the run.
      summary.push({ name: source.name, url: source.url, events: 0 })
      console.log(`failed — ${error instanceof Error ? error.message : error}`)
    }
  }

  const deduped = [...new Map(events.map((event) => [event.id, event])).values()].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title)
  )

  const dataset: EventDataset = { generatedAt: fetchedAt, sources: summary, events: deduped }
  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')
  console.log(`\nWrote ${deduped.length} events to src/data/events.json`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
