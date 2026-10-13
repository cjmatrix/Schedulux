export type PriceType = 'fixed' | 'starting_at' | 'hourly' | 'free' | 'custom';

export class PriceVO {
  constructor(
    public readonly type: PriceType = 'fixed',
    public readonly amount: number = 0,
    public readonly currency: string = 'USD',
  ) {
    if (amount < 0) {
      throw new Error('Price amount cannot be negative');
    }
  }

  static create(type?: string, amount?: number, currency?: string): PriceVO {
    const validTypes: PriceType[] = ['fixed', 'starting_at', 'hourly', 'free', 'custom'];
    const sanitizedType = (type && validTypes.includes(type as PriceType))
      ? (type as PriceType)
      : 'fixed';

    return new PriceVO(sanitizedType, amount ?? 0, currency || 'USD');
  }
}
