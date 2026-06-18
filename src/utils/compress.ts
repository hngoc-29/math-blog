import LZString from 'lz-string'

// Base64url helpers for binary encoding
function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const supportsCompressionStream = typeof CompressionStream !== 'undefined'
const GZIP_FALLBACK_TIMEOUT_MS = 1200

function timeout<T>(ms: number): Promise<T> {
  return new Promise<T>((_, reject) => {
    window.setTimeout(() => reject(new Error('timeout')), ms)
  })
}

async function gzipCompress(str: string): Promise<string> {
  if (!supportsCompressionStream) throw new Error('CompressionStream unavailable')

  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  await writer.write(new TextEncoder().encode(str))
  await writer.close()

  const chunks: Uint8Array[] = []
  const reader = cs.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const total = chunks.reduce((acc, c) => acc + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }
  return toBase64Url(merged)
}

async function gzipDecompress(str: string): Promise<string> {
  if (!supportsCompressionStream) throw new Error('CompressionStream unavailable')
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  const input = fromBase64Url(str)
  await writer.write(input)
  await writer.close()

  const chunks: Uint8Array[] = []
  const reader = ds.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  const total = chunks.reduce((acc, c) => acc + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(merged)
}

function toBase64UrlFromLz(base64: string): string {
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromBase64UrlToLz(base64url: string): string {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((base64url.length + 3) % 4)
  return padded
}

// ── Sync LZ-String variants ───────────────────────────────────────────────

export function compressSyncUri(str: string): string {
  return LZString.compressToEncodedURIComponent(str)
}

export function decompressSyncUri(str: string): string | null {
  return LZString.decompressFromEncodedURIComponent(str)
}

export function compressSyncB64(str: string): string {
  const base64 = LZString.compressToBase64(str)
  return toBase64UrlFromLz(base64)
}

export function decompressSyncB64(str: string): string | null {
  try {
    const base64 = fromBase64UrlToLz(str)
    return LZString.decompressFromBase64(base64)
  } catch {
    return null
  }
}

function encodedLength(value: string): number {
  return encodeURIComponent(value).length
}

function chooseShortest(candidates: string[]): string {
  candidates.sort((a, b) => encodedLength(a) - encodedLength(b))
  return candidates[0]
}

// ── Unified async API ──────────────────────────────────────────────────────
// Format prefixes are intentionally one character to keep links compact:
//   r<json>   -> raw JSON (best for tiny payloads)
//   u<lz-uri> -> LZ-String URI-safe
//   b<lz-b64>  -> LZ-String Base64url
//   g<gzip>    -> gzip Base64url

export async function compress(str: string): Promise<string> {
  const candidates: string[] = []

  // Raw JSON is sometimes shorter for tiny payloads.
  candidates.push(`r${str}`)

  try {
    candidates.push(`u${compressSyncUri(str)}`)
  } catch {
    // ignore
  }

  try {
    candidates.push(`b${compressSyncB64(str)}`)
  } catch {
    // ignore
  }

  if (supportsCompressionStream) {
    try {
      const gz = await Promise.race([
        gzipCompress(str),
        timeout<string>(GZIP_FALLBACK_TIMEOUT_MS),
      ])
      candidates.push(`g${gz}`)
    } catch {
      // ignore gzip failures or slow browsers and keep other variants
    }
  }

  if (candidates.length === 0) throw new Error('Failed to compress payload')
  return chooseShortest(candidates)
}

export async function decompress(encoded: string): Promise<string | null> {
  try {
    if (!encoded) return null

    const prefix = encoded[0]
    const body = encoded.slice(1)

    if (prefix === 'g') {
      return await gzipDecompress(body)
    }
    if (prefix === 'u') {
      return decompressSyncUri(body)
    }
    if (prefix === 'b') {
      return decompressSyncB64(body)
    }
    if (prefix === 'r') {
      return body
    }

    // Legacy support for previous builds.
    if (encoded.startsWith('g:')) {
      return await gzipDecompress(encoded.slice(2))
    }
    if (encoded.startsWith('gz.')) {
      return await gzipDecompress(encoded.slice(3))
    }
    if (encoded.startsWith('l:')) {
      return decompressSyncUri(encoded.slice(2))
    }
    if (encoded.startsWith('lz.')) {
      return decompressSyncUri(encoded.slice(3))
    }

    // Older payloads without prefix were LZ-String URI.
    return decompressSyncUri(encoded)
  } catch {
    return null
  }
}

/** Synchronous size estimate used for display and preview */
export function estimateSizeSync(str: string): number {
  const candidates = [
    encodedLength(`r${str}`),
    encodedLength(`u${compressSyncUri(str)}`),
    encodedLength(`b${compressSyncB64(str)}`),
  ]
  return Math.min(...candidates)
}
