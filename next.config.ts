import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NextConfig } from 'next'

/** Poster hosts are read from the scraped data, so adding a venue needs no config change. */
function posterHosts(): string[] {
  try {
    const raw = readFileSync(join(import.meta.dirname, 'src/data/events.json'), 'utf8')
    const { events } = JSON.parse(raw) as { events: { image?: string }[] }
    const hosts = events.flatMap((event) => {
      try {
        return event.image ? [new URL(event.image).hostname] : []
      } catch {
        return []
      }
    })
    return [...new Set(hosts)]
  } catch {
    return []
  }
}

const nextConfig: NextConfig = {
  // The repo sits below the user's home directory; pin the workspace root so the
  // bundler does not pick up an unrelated lockfile further up the tree.
  turbopack: { root: import.meta.dirname },
  images: {
    remotePatterns: posterHosts().map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
}

export default nextConfig
