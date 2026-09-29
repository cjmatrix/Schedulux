import nodemailer from 'nodemailer';

export interface TenantVerificationEmailData {
  to: string;
  business_name: string;
  full_name: string;
  tenant_id: string;
  verification_token: string;
  verification_url?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT) || 587;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(' [EmailService] Configured with SMTP host:', host);
    } else {
      console.log('ℹ [EmailService] No SMTP credentials provided. Running in DEV mode (emails logged to terminal).');
    }
  }

  async sendTenantVerificationEmail(data: TenantVerificationEmailData): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = data.verification_url || `${frontendUrl}/verify-email?token=${encodeURIComponent(data.verification_token)}`;
    const fromAddress = process.env.FROM_EMAIL || '"Schedulux AI" <no-reply@schedulux.ai>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email - Schedulux AI</title>
        </head>
        <body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #131b2e; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <tr>
              <td style="padding: 36px 32px;">
                <!-- Header / Logo -->
                <div style="font-size: 24px; font-weight: 700; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px;">
                  Schedulux AI
                </div>

                <!-- Title -->
                <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
                  Verify your business email
                </h1>

                <!-- Body -->
                <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0;">
                  Hello <strong style="color: #f8fafc;">${data.full_name}</strong>,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 28px 0;">
                  Thank you for creating an account for <strong style="color: #f8fafc;">${data.business_name}</strong> on Schedulux AI. Please click the button below to verify your email and activate your portal.
                </p>

                <!-- Primary Clickable Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 30px auto; width: 100%; text-align: center;">
                  <tr>
                    <td align="center">
                      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); mso-padding-alt: 0;">
                        <!--[if mso]><i style="letter-spacing: 25px; mso-font-width: -100%;" hidden>&nbsp;</i><![endif]-->
                        <span style="mso-text-raise: 15pt; color: #ffffff;">Verify Email Address</span>
                        <!--[if mso]><i style="letter-spacing: 25px;" hidden>&nbsp;</i><![endif]-->
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Secondary Clickable Text Link Fallback -->
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-top: 24px;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0;">
                    Button not working? You can also click the direct link below:
                  </p>
                  <p style="margin: 0; word-break: break-all; font-size: 13px;">
                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; text-decoration: underline;">
                      ${verifyUrl}
                    </a>
                  </p>
                </div>

                <!-- Expiry Note & Footer -->
                <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5;">
                  <p style="margin: 0 0 6px 0;">This verification link will expire in 1 hour.</p>
                  <p style="margin: 0;">If you did not register with Schedulux AI, you can safely ignore this email.</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: fromAddress,
        to: data.to,
        subject: `Verify your account for ${data.business_name} - Schedulux AI`,
        text: `Hello ${data.full_name},\n\nPlease click the link below to verify your email for ${data.business_name}:\n\n${verifyUrl}\n\nThis verification link expires in 1 hour.\n\nIf you did not create this account, please disregard this email.`,
        html: htmlContent,
      });
      console.log(`✉️  [EmailService] Verification email successfully sent to ${data.to}`);
    } else {
      console.log('\n================== [DEV EMAIL PREVIEW] ==================');
      console.log(`To: ${data.to}`);
      console.log(`Subject: Verify your account for ${data.business_name} - Schedulux AI`);
      console.log(`Tenant ID: ${data.tenant_id}`);
      console.log(`Verify Link: ${verifyUrl}`);
      console.log('=========================================================\n');
    }
  }
}

export const emailService = new EmailService();
