import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || "ap-south-1" });
const fromEmail = process.env.FROM_EMAIL || "no-reply@schedulux.ai";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

function buildVerificationEmailHtml({ fullName, businessName, verificationUrl }) {
  return `<!DOCTYPE html>
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
          <div style="font-size: 24px; font-weight: 700; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px;">
            Schedulux AI
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
            Verify your business email
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0;">
            Hello <strong style="color: #f8fafc;">${fullName}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 28px 0;">
            Thank you for creating an account for <strong style="color: #f8fafc;">${businessName}</strong> on Schedulux AI. Please click the button below to verify your email and activate your portal.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 30px auto; width: 100%; text-align: center;">
            <tr>
              <td align="center">
                <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>
          <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0;">
              Button not working? You can also click the direct link below:
            </p>
            <p style="margin: 0; word-break: break-all; font-size: 13px;">
              <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; text-decoration: underline;">
                ${verificationUrl}
              </a>
            </p>
          </div>
          <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 6px 0;">This verification link will expire in 1 hour.</p>
            <p style="margin: 0;">If you did not register with Schedulux AI, you can safely ignore this email.</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildInvitationEmailHtml({ name, businessName, inviteLink, email }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited to Schedulux AI</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #131b2e; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <tr>
        <td style="padding: 36px 32px;">
          <div style="font-size: 24px; font-weight: 700; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px;">
            Schedulux AI
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
            Dashboard Access Invitation
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0;">
            Hello <strong style="color: #f8fafc;">${name}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
            You have been invited to join the Schedulux dashboard for <strong style="color: #f8fafc;">${businessName}</strong> as a <strong style="color: #818cf8; text-transform: uppercase;">Manager</strong>.
          </p>
          <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;"><strong>Email:</strong> <span style="color: #ffffff;">${email}</span></p>
            <p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>Role:</strong> <span style="color: #ffffff;">Operations Manager</span></p>
          </div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto; width: 100%; text-align: center;">
            <tr>
              <td align="center">
                <a href="${inviteLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                  Accept Invitation & Set Password
                </a>
              </td>
            </tr>
          </table>
          <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0;">
              Button not working? You can also click the direct link below:
            </p>
            <p style="margin: 0; word-break: break-all; font-size: 13px;">
              <a href="${inviteLink}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; text-decoration: underline;">
                ${inviteLink}
              </a>
            </p>
          </div>
          <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0;">This invitation link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildForgotPasswordEmailHtml({ name, resetUrl }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password - Schedulux AI</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #131b2e; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <tr>
        <td style="padding: 36px 32px;">
          <div style="font-size: 24px; font-weight: 700; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px;">
            Schedulux AI
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
            Reset your password
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0;">
            Hello <strong style="color: #f8fafc;">${name}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 28px 0;">
            We received a request to reset your password. Click the button below to choose a new password:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 30px auto; width: 100%; text-align: center;">
            <tr>
              <td align="center">
                <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>
          <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin: 0; word-break: break-all; font-size: 13px;">
              <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; text-decoration: underline;">
                ${resetUrl}
              </a>
            </p>
          </div>
          <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 6px 0;">This password reset link will expire in 15 minutes.</p>
            <p style="margin: 0;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmail({ to, subject, htmlContent }) {
  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlContent,
          Charset: "UTF-8",
        },
      },
    },
  });

  return await ses.send(command);
}

export const handler = async (event) => {
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const parsed = JSON.parse(record.body);
      const jobName = parsed.name || parsed.jobName;
      const data = parsed.data || parsed;

      switch (jobName) {
        case "send-tenant-verification": {
          const to = data.to;
          const fullName = data.full_name || "Valued Customer";
          const businessName = data.business_name || "Your Business";
          const verificationToken = data.verification_token;
          const verificationUrl =
            data.verification_url ||
            `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

          const html = buildVerificationEmailHtml({
            fullName,
            businessName,
            verificationUrl,
          });

          await sendEmail({
            to,
            subject: `Verify your account for ${businessName} - Schedulux AI`,
            htmlContent: html,
          });
          console.log(`[EmailWorker] Verification email sent to ${to}`);
          break;
        }

        case "send-user-invitation": {
          const to = data.to;
          const name = data.name || "Team Member";
          const businessName = data.business_name || "your workspace";
          const inviteLink =
            data.invitation_url ||
            (data.invitation_token
              ? `${frontendUrl}/dashboarduser/accept-invite?token=${encodeURIComponent(data.invitation_token)}`
              : `${frontendUrl}/login`);

          const html = buildInvitationEmailHtml({
            name,
            businessName,
            inviteLink,
            email: to,
          });

          await sendEmail({
            to,
            subject: `Invitation to Schedulux Dashboard (Manager)`,
            htmlContent: html,
          });
          console.log(`[EmailWorker] User invitation email sent to ${to}`);
          break;
        }

        case "send-forgot-password": {
          const to = data.to;
          const name = data.name || "User";
          const role = data.role || "tenant";
          const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(data.reset_token)}&role=${encodeURIComponent(role)}`;

          const html = buildForgotPasswordEmailHtml({
            name,
            resetUrl,
          });

          await sendEmail({
            to,
            subject: `Reset your password - Schedulux AI`,
            htmlContent: html,
          });
          console.log(`[EmailWorker] Forgot password email sent to ${to}`);
          break;
        }

        default: {
          if (data.verification_token) {
            const to = data.to;
            const fullName = data.full_name || "Valued Customer";
            const businessName = data.business_name || "Your Business";
            const verificationToken = data.verification_token;
            const verificationUrl =
              data.verification_url ||
              `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

            const html = buildVerificationEmailHtml({
              fullName,
              businessName,
              verificationUrl,
            });

            await sendEmail({
              to,
              subject: `Verify your account for ${businessName} - Schedulux AI`,
              htmlContent: html,
            });
            console.log(`[EmailWorker] Fallback verification email sent to ${to}`);
          } else {
            console.warn(`[EmailWorker] Ignored unknown job: ${jobName}`);
          }
          break;
        }
      }
    } catch (err) {
      console.error(`[EmailWorker] Error processing message ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
