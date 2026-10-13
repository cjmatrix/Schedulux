export class DepositVO {
    required;
    amount;
    processor;
    upiId;
    qrCodeUrl;
    confirmationMethod;
    paymentInstructions;
    constructor(required = false, amount = 0, processor = '', upiId = '', qrCodeUrl = '', confirmationMethod = 'automatic', paymentInstructions = '') {
        this.required = required;
        this.amount = amount;
        this.processor = processor;
        this.upiId = upiId;
        this.qrCodeUrl = qrCodeUrl;
        this.confirmationMethod = confirmationMethod;
        this.paymentInstructions = paymentInstructions;
        if (required && amount <= 0) {
            throw new Error('Deposit amount must be greater than 0 if deposit is required');
        }
    }
    static create(props) {
        return new DepositVO(props?.required ?? false, props?.amount ?? 0, props?.processor ?? '', props?.upiId ?? '', props?.qrCodeUrl ?? '', props?.confirmationMethod ?? 'automatic', props?.paymentInstructions ?? '');
    }
}
