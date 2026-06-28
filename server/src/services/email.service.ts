import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!config.EMAIL_HOST || !config.EMAIL_USER || !config.EMAIL_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465,
    auth: { user: config.EMAIL_USER, pass: config.EMAIL_PASS },
  });
  return transporter;
}

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: MailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    logger.warn(`Email not configured — skipping send to ${opts.to}`);
    return false;
  }
  try {
    await t.sendMail({
      from: `"TapMenu" <${config.EMAIL_FROM || config.EMAIL_USER}>`,
      to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    logger.info(`Email sent to ${opts.to}: ${opts.subject}`);
    return true;
  } catch (err) {
    logger.error(`Email send failed to ${opts.to}:`, err);
    return false;
  }
}

// ── Email Templates ──────────────────────────────────────────────────────────

export function welcomeEmail(firstName: string, restaurantName?: string) {
  return {
    subject: 'Welcome to TapMenu 🎉',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#f97316;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">TapMenu</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">Welcome, ${firstName}! 👋</h2>
          <p style="color:#555;line-height:1.6;">
            ${restaurantName ? `Your restaurant <strong>${restaurantName}</strong> has been created successfully.` : 'Your account has been created.'}
            You can now log in and start managing your restaurant.
          </p>
          <a href="${config.CLIENT_URL}/owner" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Go to Dashboard
          </a>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          © ${new Date().getFullYear()} TapMenu. All rights reserved.
        </div>
      </div>
    `,
  };
}

export function passwordResetEmail(firstName: string, resetUrl: string) {
  return {
    subject: 'Reset your TapMenu password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#f97316;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">TapMenu</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">Reset Your Password</h2>
          <p style="color:#555;line-height:1.6;">Hi ${firstName}, we received a request to reset your password. Click the button below. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Reset Password
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          © ${new Date().getFullYear()} TapMenu. All rights reserved.
        </div>
      </div>
    `,
  };
}

export function subscriptionExpiryEmail(firstName: string, planName: string, expiryDate: string) {
  return {
    subject: `Your TapMenu ${planName} subscription expires soon`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#f97316;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">TapMenu</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">⏰ Subscription Expiring Soon</h2>
          <p style="color:#555;line-height:1.6;">Hi ${firstName}, your <strong>${planName}</strong> plan expires on <strong>${expiryDate}</strong>.</p>
          <p style="color:#555;line-height:1.6;">Renew now to avoid any interruption to your restaurant operations.</p>
          <a href="${config.CLIENT_URL}/owner/subscription" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Renew Subscription
          </a>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          © ${new Date().getFullYear()} TapMenu. All rights reserved.
        </div>
      </div>
    `,
  };
}

export function orderInvoiceEmail(customerName: string, orderNumber: string, totalAmount: number) {
  return {
    subject: `Your TapMenu order #${orderNumber} confirmation`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#f97316;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">TapMenu</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">Order Confirmed ✅</h2>
          <p style="color:#555;">Hi ${customerName}, your order <strong>#${orderNumber}</strong> has been placed successfully.</p>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#111;">Total: ₹${totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <p style="color:#555;font-size:14px;">Thank you for choosing us! 🙏</p>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          © ${new Date().getFullYear()} TapMenu. All rights reserved.
        </div>
      </div>
    `,
  };
}
