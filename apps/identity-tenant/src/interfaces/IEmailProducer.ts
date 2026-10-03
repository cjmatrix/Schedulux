export interface TenantVerificationEmailPayload {
  to: string;
  business_name: string;
  full_name: string;
  tenant_id: string;
  verification_token: string;
  verification_url?: string;
}

export interface UserInvitationEmailPayload {
  to: string;
  name: string;
  tenant_id: string;
  business_name?: string;
  password: string;
  system_role: string;
}

export interface ForgotPasswordEmailPayload {
  to: string;
  name: string;
  reset_token: string;
  role: 'tenant' | 'dashboard_user';
}

export interface IEmailProducer {
  sendVerificationEmail(data: TenantVerificationEmailPayload): Promise<void>;
  sendUserInvitationEmail(data: UserInvitationEmailPayload): Promise<void>;
  sendForgotPasswordEmail(data: ForgotPasswordEmailPayload): Promise<void>;
}
