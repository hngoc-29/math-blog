import { decompress } from './compress'
import type { Payload } from './encode'
import { parseCompactPayload } from './encode'

function normalizeEncodedValue(encoded: string): string {
  const trimmed = encoded.trim()

  if (!trimmed) return trimmed

  // New compact formats use a single-character prefix.
  const prefix = trimmed[0]
  if (prefix === 'r' || prefix === 'u' || prefix === 'b' || prefix === 'g') {
    return trimmed
  }

  // Legacy links used a header before a dot, e.g. "base64header.gz...."
  // Keep support for them, but avoid stripping valid new short tokens.
  if ((trimmed.startsWith('g:') || trimmed.startsWith('l:') || trimmed.startsWith('gz.') || trimmed.startsWith('lz.'))) {
    return trimmed
  }

  const firstDot = trimmed.indexOf('.')
  if (firstDot > 0) {
    const head = trimmed.slice(0, firstDot)
    // Old header was base64url-ish and short-ish; if it looks like that, strip it.
    if (/^[A-Za-z0-9_-]{3,64}$/.test(head)) {
      return trimmed.slice(firstDot + 1)
    }
  }

  return trimmed
}

export async function decodePayload(encoded: string): Promise<Payload | null> {
  try {
    const body = normalizeEncodedValue(encoded)
    const decompressed = await decompress(body)
    if (!decompressed) return null

    const parsed = JSON.parse(decompressed)
    const compact = parseCompactPayload(parsed)
    if (compact) return compact

    // Legacy payload shape
    if (parsed && typeof parsed === 'object') {
      const legacy = parsed as Partial<Payload>
      if (typeof legacy.title === 'string' && typeof legacy.content === 'string') {
        return {
          title: legacy.title,
          content: legacy.content,
          createdAt: typeof legacy.createdAt === 'string' ? legacy.createdAt : undefined,
          theme: typeof legacy.theme === 'string' ? legacy.theme : undefined,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

function readHashPayload(): string | null {
  const hash = window.location.hash
  if (!hash || hash === '#') return null
  return decodeURIComponent(hash.slice(1))
}

export async function readPayloadFromURL(): Promise<Payload | null> {
  const fromHash = readHashPayload()
  if (fromHash) return decodePayload(fromHash)

  const params = new URLSearchParams(window.location.search)
  const data = params.get('h') ?? params.get('data') ?? params.get('s')
  if (!data) return null
  return decodePayload(data)
}
