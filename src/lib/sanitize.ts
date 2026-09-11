import sanitizeHtml from 'sanitize-html'

/** Video hosts venues embed trailers from; any other <iframe> is dropped. */
const EMBED_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com']

/**
 * Blocks that carry nothing once zero-width characters and whitespace are gone.
 * Listed by their source names: the filter sees a tag before `transformTags` renames it.
 */
const DROP_WHEN_EMPTY = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'strong', 'b', 'em', 'i', 'u', 'a'])
const INVISIBLE = /[\s\u200b-\u200d\ufeff]/g

/** Venue CMSes pad blocks with <br>s for spacing; the page's own rhythm replaces them. */
function trimBreaks(html: string): string {
  return html
    .replace(/<(p|li|h[2-4]|td|th|figcaption)>(?:\s|<br \/>)+/g, '<$1>')
    .replace(/(?:\s|<br \/>)+<\/(p|li|h[2-4]|td|th|figcaption)>/g, '</$1>')
    .replace(/<p><\/p>/g, '')
}

function absolute(value: string | undefined, baseUrl?: string): string {
  if (!value) return ''
  try {
    return new URL(value, baseUrl).href
  } catch {
    return ''
  }
}

/**
 * The one allowlist for event write-ups copied from venue sites. The scraper runs it to
 * normalise what it stores (absolute URLs, no scripts or inline styles); the event page
 * runs it again right before injecting, so rendering never trusts the data file alone.
 */
export function sanitizeEventHtml(html: string, baseUrl?: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 'sup', 'sub',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'iframe',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      iframe: ['src', 'title', 'allowfullscreen'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedIframeHostnames: EMBED_HOSTS,
    allowIframeRelativeUrls: false,
    transformTags: {
      h1: 'h2',
      h5: 'h4',
      h6: 'h4',
      a: (tagName, attribs) => ({
        tagName,
        attribs: { href: absolute(attribs.href, baseUrl), target: '_blank', rel: 'noopener noreferrer' },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, src: absolute(attribs.src, baseUrl), loading: 'lazy' },
      }),
    },
    exclusiveFilter: (frame) =>
      DROP_WHEN_EMPTY.has(frame.tag) &&
      frame.mediaChildren.length === 0 &&
      !frame.text.replace(INVISIBLE, ''),
  })
  return trimBreaks(clean).trim()
}
