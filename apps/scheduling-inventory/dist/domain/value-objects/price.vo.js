export class PriceVO {
    type;
    amount;
    currency;
    constructor(type = 'fixed', amount = 0, currency = 'USD') {
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        if (amount < 0) {
            throw new Error('Price amount cannot be negative');
        }
    }
    static create(type, amount, currency) {
        const validTypes = ['fixed', 'starting_at', 'hourly', 'free', 'custom'];
        const sanitizedType = (type && validTypes.includes(type))
            ? type
            : 'fixed';
        return new PriceVO(sanitizedType, amount ?? 0, currency || 'USD');
    }
}
