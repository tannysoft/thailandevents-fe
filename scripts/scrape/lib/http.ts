const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function request(url: string, accept: string): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'th,en;q=0.8' },
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      return res
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1500))
    }
  }
  throw new Error(`GET ${url} failed: ${lastError}`)
}

export async function getJson<T>(url: string): Promise<T> {
  return (await request(url, 'application/json')).json() as Promise<T>
}

export async function getHtml(url: string): Promise<string> {
  return (await request(url, 'text/html')).text()
}

/** Venue sites are small; stay polite between requests. */
export function throttle(ms = 700) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Visits items one at a time with a pause between requests. A failure leaves that
 * item untouched: a missing description must never cost us the event itself.
 */
export async function enrichEach<T>(items: T[], task: (item: T) => Promise<void>, pauseMs = 400) {
  for (const item of items) {
    try {
      await task(item)
    } catch {
      // Keep the calendar entry as scraped from the listing.
    }
    await throttle(pauseMs)
  }
}
