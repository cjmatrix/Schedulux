export class DepositVO {
  constructor(
    public readonly required: boolean = false,
    public readonly amount: number = 0,
    public readonly processor: string = '',
    public readonly upiId: string = '',
    public readonly qrCodeUrl: string = '',
    public readonly confirmationMethod: string = 'automatic',
    public readonly paymentInstructions: string = '',
  ) {
    if (required && amount <= 0) {
      throw new Error('Deposit amount must be greater than 0 if deposit is required');
    }
  }

  static create(props?: {
    required?: boolean;
    amount?: number;
    processor?: string;
    upiId?: string;
    qrCodeUrl?: string;
    confirmationMethod?: string;
    paymentInstructions?: string;
  }): DepositVO {
    return new DepositVO(
      props?.required ?? false,
      props?.amount ?? 0,
      props?.processor ?? '',
      props?.upiId ?? '',
      props?.qrCodeUrl ?? '',
      props?.confirmationMethod ?? 'automatic',
      props?.paymentInstructions ?? '',
    );
  }
}
