import { compress, estimateSizeSync } from './compress'

export type MediaType = 'image' | 'audio' | 'video' | 'file'
export type MediaSource = 'upload' | 'url'

export interface MediaAttachment {
  id: string
  type: MediaType
  source: MediaSource
  name: string
  mimeType: string
  // For uploads: base64 data URL. For URL embeds: the remote URL.
  dataUrl: string
  size: number  // 0 for URL embeds
}

export interface Payload {
  title: string
  content: string
  createdAt?: string
  theme?: string
}

export async function encodePayload(payload: Payload): Promise<string> {
  const json = JSON.stringify({
    ...payload,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  })
  const compressed = await compress(json)
  const header = btoa(JSON.stringify({ typ: 'SHL', alg: 'none', v: 3 }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${header}.${compressed}`
}

export async function buildShareURL(payload: Payload): Promise<string> {
  const encoded = await encodePayload(payload)
  const base = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  return `${base}?data=${encoded}`
}

/** Fast sync estimate for display (LZ-String, slightly larger than gzip) */
export function estimateSize(payload: Payload): number {
  const json = JSON.stringify(payload)
  const len = estimateSizeSync(json)
  return Math.round(len / 1024 * 10) / 10
}
