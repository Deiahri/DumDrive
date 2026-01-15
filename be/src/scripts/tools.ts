export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


import { CrockfordBase32 } from 'crockford-base32';
export function ConvertToBase32(id: string): string {
  const buffer = Buffer.from(id, 'utf-8');
  return CrockfordBase32.encode(buffer);
}