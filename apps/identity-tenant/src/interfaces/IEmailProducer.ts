export interface TenantVerificationEmailPayload {
  to: string;
  business_name: string;
  full_name: string;
  tenant_id: string;
  verification_token: string;
  verification_url?: string;
}

export interface IEmailProducer {
  sendVerificationEmail(data: TenantVerificationEmailPayload): Promise<void>;
}
