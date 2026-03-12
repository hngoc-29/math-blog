import { compressText } from './compress';

export interface MessagePayload {
  title: string;
  content: string;
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function encodePayload(payload: MessagePayload): string {
  const compressed = compressText(JSON.stringify(payload));
  return utf8ToBase64(compressed);
}
