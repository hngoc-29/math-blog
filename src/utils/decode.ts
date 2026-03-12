import { decompress } from './compress'
import type { Payload } from './encode'

export async function decodePayload(encoded: string): Promise<Payload | null> {
  try {
    const dotIdx = encoded.indexOf('.')
    const body = dotIdx >= 0 ? encoded.slice(dotIdx + 1) : encoded
    const decompressed = await decompress(body)
    if (!decompressed) return null
    const parsed = JSON.parse(decompressed) as Payload
    if (typeof parsed.title !== 'string' || typeof parsed.content !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export async function readPayloadFromURL(): Promise<Payload | null> {
  const params = new URLSearchParams(window.location.search)
  const data = params.get('data')
  if (!data) return null
  return decodePayload(data)
}
