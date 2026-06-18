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
  size: number // 0 for URL embeds
}

export interface Payload {
  title: string
  content: string
  createdAt?: string
  theme?: string
}

type CompactPayload = {
  t: string
  c: string
}

function compactPayload(payload: Payload): CompactPayload {
  return {
    t: payload.title,
    c: payload.content,
  }
}

function expandPayload(payload: Partial<CompactPayload> | unknown): Payload | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Partial<CompactPayload>

  if (typeof p.t !== 'string' || typeof p.c !== 'string') return null

  const result: Payload = {
    title: p.t,
    content: p.c,
  }

  return result
}

export async function encodePayload(payload: Payload): Promise<string> {
  // Compact object keys to keep the serialized payload small before compression.
  const json = JSON.stringify(compactPayload(payload))
  return compress(json)
}

export async function buildShareURL(payload: Payload): Promise<string> {
  const encoded = await encodePayload(payload)
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#${encodeURIComponent(encoded)}`
}

/** Fast sync estimate for display */
export function estimateSize(payload: Payload): number {
  const json = JSON.stringify(compactPayload(payload))
  const len = estimateSizeSync(json)
  return Math.round((len / 1024) * 10) / 10
}

export function parseCompactPayload(value: unknown): Payload | null {
  return expandPayload(value)
}
