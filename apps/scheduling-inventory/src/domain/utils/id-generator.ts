import { customAlphabet } from 'nanoid';

const generateSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
const generateBookingCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

export function generateSemanticId(
  prefix: 'srv' | 'res' | 'cus' | 'bk',
  name: string,
): string {
  const slug = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 28)
    .replace(/^_+|_+$/g, '');

  const suffix = generateSuffix();

  return slug ? `${prefix}_${slug}_${suffix}` : `${prefix}_${suffix}`;
}

export function generateBookingReference(): string {
  return `BK-${generateBookingCode()}`;
}

