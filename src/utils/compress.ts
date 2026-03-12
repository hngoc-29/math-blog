import LZString from 'lz-string'

// ── Gzip via CompressionStream (modern browsers) ──────────────────────────
// Falls back to LZ-String if CompressionStream is unavailable.

const supportsGzip = typeof CompressionStream !== 'undefined'

async function gzipCompress(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()
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
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }
  // Encode as base64url
  let binary = ''
  for (let i = 0; i < merged.length; i++) binary += String.fromCharCode(merged[i])
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function gzipDecompress(b64url: string): Promise<string> {
  // Restore standard base64
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
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
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }
  return new TextDecoder().decode(merged)
}

// ── Sync LZ-String fallback ────────────────────────────────────────────────

export function compressSync(str: string): string {
  return LZString.compressToEncodedURIComponent(str)
}

export function decompressSync(str: string): string | null {
  return LZString.decompressFromEncodedURIComponent(str)
}

// ── Unified async API ──────────────────────────────────────────────────────
// Format: "gz.<base64url>" for gzip, "lz.<lzstring>" for LZ-String

export async function compress(str: string): Promise<string> {
  if (supportsGzip) {
    try {
      const gz = await gzipCompress(str)
      return `gz.${gz}`
    } catch {
      // fall through to LZ
    }
  }
  return `lz.${compressSync(str)}`
}

export async function decompress(encoded: string): Promise<string | null> {
  if (encoded.startsWith('gz.')) {
    try {
      return await gzipDecompress(encoded.slice(3))
    } catch {
      return null
    }
  }
  if (encoded.startsWith('lz.')) {
    return decompressSync(encoded.slice(3))
  }
  // Legacy: no prefix → assume LZ-String (v1 URLs)
  return decompressSync(encoded)
}

/** Synchronous size estimate (LZ only — for display purposes) */
export function estimateSizeSync(str: string): number {
  return compressSync(str).length
}
