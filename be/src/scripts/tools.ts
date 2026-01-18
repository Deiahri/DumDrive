export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


import { CrockfordBase32 } from 'crockford-base32';
export function ConvertToBase32(id: string): string {
  const buffer = Buffer.from(id, 'utf-8');
  return CrockfordBase32.encode(buffer);
}

export function ExtractFromBase32(id: string): string {
  const buffer = CrockfordBase32.decode(id);
  return Buffer.from(buffer).toString('utf-8');
}