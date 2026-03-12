import { decompressText } from './compress';
import type { MessagePayload } from './encode';

function base64ToUtf8(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodePayload(data: string): MessagePayload {
  const decoded = base64ToUtf8(data);
  const json = decompressText(decoded);
  const parsed = JSON.parse(json);

  if (typeof parsed.title !== 'string' || typeof parsed.content !== 'string') {
    throw new Error('Invalid message payload format');
  }

  return {
    title: parsed.title,
    content: parsed.content
  };
}
