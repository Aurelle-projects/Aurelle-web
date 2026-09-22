import crypto from "crypto";

const SECRET = process.env.SUPABASE_SECRET_KEY || "aurelle-secure-otp-secret";

/**
 * Generate a 6-digit numeric OTP string
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a signed HMAC token containing the email, OTP hash, and expiration timestamp.
 */
export function createOtpToken(email: string, otp: string, expiresInMs = 10 * 60 * 1000): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + expiresInMs;
  const hash = crypto
    .createHmac("sha256", SECRET)
    .update(`${normalizedEmail}:${otp.trim()}:${expiresAt}`)
    .digest("hex");

  return Buffer.from(
    JSON.stringify({
      email: normalizedEmail,
      expiresAt,
      hash,
    })
  ).toString("base64");
}

/**
 * Verify that the submitted OTP matches the signed HMAC token and is not expired.
 */
export function verifyOtpToken(email: string, otp: string, token: string): boolean {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));

    if (!payload.email || !payload.expiresAt || !payload.hash) {
      return false;
    }

    if (payload.email !== normalizedEmail) {
      return false;
    }

    if (Date.now() > payload.expiresAt) {
      return false;
    }

    const expectedHash = crypto
      .createHmac("sha256", SECRET)
      .update(`${normalizedEmail}:${otp.trim()}:${payload.expiresAt}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(payload.hash));
  } catch {
    return false;
  }
}

/**
 * Create a short-lived token allowing the user to reset their password after verifying OTP.
 */
export function createResetToken(email: string, expiresInMs = 15 * 60 * 1000): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + expiresInMs;
  const hash = crypto
    .createHmac("sha256", SECRET)
    .update(`reset:${normalizedEmail}:${expiresAt}`)
    .digest("hex");

  return Buffer.from(
    JSON.stringify({
      email: normalizedEmail,
      expiresAt,
      hash,
    })
  ).toString("base64");
}

/**
 * Verify the reset token before changing password.
 */
export function verifyResetToken(email: string, token: string): boolean {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));

    if (!payload.email || !payload.expiresAt || !payload.hash) {
      return false;
    }

    if (payload.email !== normalizedEmail) {
      return false;
    }

    if (Date.now() > payload.expiresAt) {
      return false;
    }

    const expectedHash = crypto
      .createHmac("sha256", SECRET)
      .update(`reset:${normalizedEmail}:${payload.expiresAt}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(payload.hash));
  } catch {
    return false;
  }
}

/**
 * Send the 6-digit OTP email using Brevo
 */
export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Aurelle";

  if (!brevoApiKey || !senderEmail) {
    console.error("Brevo configuration missing.");
    return { success: false, error: "Email service is not configured." };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F7F5EF; margin: 0; padding: 30px; }
          .container { max-width: 480px; margin: 0 auto; background: #ffffff; padding: 40px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .brand { text-align: center; font-family: Georgia, serif; font-size: 24px; color: #183D2B; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
          .title { font-size: 18px; font-weight: 600; color: #1D211F; text-align: center; margin-bottom: 12px; }
          .text { font-size: 14px; color: #5C6460; line-height: 1.6; text-align: center; margin-bottom: 24px; }
          .otp-box { background: #F7F5EF; border: 1px dashed #183D2B; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #183D2B; font-family: monospace; }
          .footer { font-size: 12px; color: #8C938F; text-align: center; margin-top: 32px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">AURELLE</div>
          <div class="title">Password Reset Code</div>
          <div class="text">
            We received a request to reset the password for your Aurelle account.
            Use the 6-digit verification code below to proceed:
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <div class="text">
            This code will expire in <strong>10 minutes</strong>. If you did not request this, please disregard this email and your password will remain unchanged.
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Aurelle. All rights reserved.<br/>
            Luxury beauty, skincare and wellness essentials.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email }],
        subject: `${otp} is your Aurelle password reset code`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Brevo API error:", errText);
      return { success: false, error: "Failed to send verification code email." };
    }

    return { success: true };
  } catch (err) {
    console.error("Brevo fetch error:", err);
    return { success: false, error: "Network error sending email." };
  }
}
