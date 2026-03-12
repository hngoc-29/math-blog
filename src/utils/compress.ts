import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export function compressText(text: string): string {
  return compressToEncodedURIComponent(text);
}

export function decompressText(compressedText: string): string {
  const value = decompressFromEncodedURIComponent(compressedText);
  if (value === null) {
    throw new Error('Unable to decompress payload');
  }
  return value;
}
