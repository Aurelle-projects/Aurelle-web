/**
 * lib/email/brevo.ts
 * Shared Brevo transactional email helpers.
 * All functions are server-only (never import from client components).
 */

import { createReviewToken } from "@/lib/auth/reviewToken";

// ── Types ──────────────────────────────────────────────────────────

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string | null;
  sku?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount?: number;
  shippingAmount: number;
  total: number;
  shippingAddress: {
    fullName?: string;
    streetAddress?: string;
    addressLine1?: string;
    area?: string;
    addressLine2?: string;
    emirate?: string;
    city?: string;
    country?: string;
    phone?: string;
  };
  paymentMethod?: string;
}

// ── Core send helper ────────────────────────────────────────────────

async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}): Promise<{ success: boolean; error?: string }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = (process.env.BREVO_SENDER_NAME || "Aurelle").replace(/^['"]|['"]$/g, "");

  if (!brevoApiKey || !senderEmail) {
    console.error("[Brevo] Configuration missing.");
    return { success: false, error: "Email service is not configured." };
  }

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
        to,
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Brevo] API error:", errText);
      return { success: false, error: "Failed to send email via Brevo." };
    }

    return { success: true };
  } catch (err) {
    console.error("[Brevo] Fetch error:", err);
    return { success: false, error: "Network error while sending email." };
  }
}

// ── Shared HTML wrapper (Enterprise Amazon / Noon E-Commerce Standard) ────────

const baseStyles = `
  /* Resets */
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #F6F4EE; }
  
  /* Prevent dark-mode auto-inversion */
  :root {
    color-scheme: light;
    supported-color-schemes: light;
  }
  
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; max-width: 100% !important; }
    .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    .mobile-stack { display: block !important; width: 100% !important; max-width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; }
  }
`;

function emailWrapper(body: string, previewText?: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const logoUrl = `${siteUrl}/Aurelle-Logo.png`;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
    <title>Aurelle</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
      ${baseStyles}
    </style>
  </head>
  <body bgcolor="#F6F4EE" style="margin:0; padding:0; background-color:#F6F4EE; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
    ${
      previewText
        ? `<div style="display:none; font-size:1px; color:#F6F4EE; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
            ${previewText}
          </div>`
        : ""
    }

    <!-- 100% Full-Width Outer Canvas (Ivory Tone) -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F6F4EE" style="background-color:#F6F4EE; table-layout:fixed;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          
          <!-- Main 600px Card Container (Amazon / Noon Standard) -->
          <table class="email-container" width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:12px; border:1px solid #E6E1D6; box-shadow:0 4px 24px rgba(24,61,43,0.06); overflow:hidden;">
            
            <!-- ── HEADER STRIP: Official OG Logo + Luxury Tagline ── -->
            <tr>
              <td align="center" bgcolor="#FFFFFF" style="padding:32px 30px 22px; border-bottom:2px solid #183D2B; background-color:#FFFFFF;">
                <a href="${siteUrl}" target="_blank" style="text-decoration:none; display:inline-block;">
                  <img
                    src="${logoUrl}"
                    alt="AURELLE"
                    width="155"
                    height="78"
                    border="0"
                    style="display:block; width:155px; height:auto; max-width:155px; margin:0 auto; outline:none; border:none; font-family:Georgia, serif; font-size:26px; font-weight:bold; color:#183D2B; letter-spacing:3px;"
                  />
                </a>
                <p style="margin:10px 0 0; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#7B857F; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  DUBAI &bull; UAE LUXURY COSMETICS &bull; OFFICIAL
                </p>
              </td>
            </tr>

            <!-- ── DYNAMIC BODY CONTENT ── -->
            <tr>
              <td class="mobile-padding" bgcolor="#FFFFFF" style="padding:36px 36px 32px; background-color:#FFFFFF;">
                ${body}
              </td>
            </tr>

            <!-- ── TRUST PILLARS BAR (Noon / Amazon E-Commerce Standard) ── -->
            <tr>
              <td bgcolor="#FAF8F5" style="padding:18px 24px; border-top:1px solid #EDE9DF; background-color:#FAF8F5;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="font-size:11px; font-weight:600; color:#5C6460; line-height:1.6; text-align:center;">
                      <span style="color:#183D2B; font-weight:700;">&#10003; 100% Authentic Products</span>
                      &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                      <span style="color:#183D2B; font-weight:700;">Fast UAE Delivery</span>
                      &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                      <span style="color:#183D2B; font-weight:700;">24/7 WhatsApp Concierge</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ── ENTERPRISE FOOTER ── -->
            <tr>
              <td bgcolor="#183D2B" style="padding:32px 30px; background-color:#183D2B; text-align:center; color:#E8DCC4;">
                <p style="margin:0 0 12px; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#FFFFFF;">
                  AURELLE COSMETICS TRADING FZ-LLC
                </p>
                
                <!-- Quick Navigation Links -->
                <p style="margin:0 0 16px; font-size:12px; color:#D5CBB8;">
                  <a href="${siteUrl}/shop" style="color:#FFFFFF; text-decoration:none; font-weight:600;">Shop All</a> &nbsp;|&nbsp;
                  <a href="${siteUrl}/track-order" style="color:#FFFFFF; text-decoration:none; font-weight:600;">Track Order</a> &nbsp;|&nbsp;
                  <a href="${siteUrl}/refund-policy" style="color:#FFFFFF; text-decoration:none; font-weight:600;">Returns &amp; Refunds</a> &nbsp;|&nbsp;
                  <a href="https://wa.me/971562096388" style="color:#25D366; text-decoration:none; font-weight:600;">WhatsApp</a>
                </p>

                <p style="margin:0 0 8px; font-size:11px; line-height:1.5; color:#A7B6AC;">
                  Need assistance? Our concierge is available 24/7 at <a href="mailto:care@aurelle.ae" style="color:#FFFFFF; text-decoration:underline;">care@aurelle.ae</a> or WhatsApp at <a href="https://wa.me/971562096388" style="color:#FFFFFF; text-decoration:underline;">+971 56 209 6388</a>.
                </p>

                <p style="margin:16px 0 0; font-size:10px; color:#8A9E92; border-top:1px solid rgba(232, 220, 196, 0.15); padding-top:14px; line-height:1.5;">
                  &copy; ${currentYear} Aurelle Cosmetics Trading FZ-LLC. All rights reserved.<br />
                  Dubai Silicon Oasis, Dubai, United Arab Emirates.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ── 1. Welcome Email (Redesigned Editorial Luxury Layout) ───────────

export async function sendWelcomeEmail(
  email: string,
  fullName?: string
): Promise<{ success: boolean; error?: string }> {
  const displayName = fullName?.trim() || "Valued Member";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";

  const htmlContent = emailWrapper(`
    <!-- Status Tag -->
    <div style="text-align:center; margin-bottom:16px;">
      <span style="display:inline-block; padding:5px 14px; background-color:#F0F7F3; color:#183D2B; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; border-radius:20px; border:1px solid #D1E5DA;">
        MEMBERSHIP CONFIRMED
      </span>
    </div>

    <!-- Main Headline -->
    <h1 style="text-align:center; font-family:Georgia, serif; font-size:24px; font-weight:700; color:#1D211F; margin:0 0 14px; letter-spacing:0.3px;">
      Welcome to Aurelle, ${displayName}
    </h1>

    <!-- Editorial Welcome Narrative -->
    <p style="font-size:14px; color:#4A524D; line-height:1.7; text-align:center; margin:0 auto 28px; max-width:480px;">
      Your personal account is now active. We are delighted to welcome you to our community &mdash; your destination for verified luxury beauty, clinical skincare, and fine fragrances across the United Arab Emirates.
    </p>

    <!-- 3 Value Pillars (Amazon / Noon Standard) -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px; background-color:#FAF8F5; border:1px solid #EDE9DF; border-radius:8px; overflow:hidden;">
      <tr>
        <td style="padding:16px 18px; border-bottom:1px solid #EDE9DF;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="middle" style="font-size:18px;">🚚</td>
              <td valign="middle" style="padding-left:10px;">
                <p style="margin:0; font-size:12px; font-weight:700; color:#1D211F;">Next-Day UAE Delivery</p>
                <p style="margin:2px 0 0; font-size:11px; color:#6B726E;">Prompt dispatch across Dubai, Abu Dhabi, Sharjah &amp; all Emirates.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 18px; border-bottom:1px solid #EDE9DF;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="middle" style="font-size:18px;">🛡️</td>
              <td valign="middle" style="padding-left:10px;">
                <p style="margin:0; font-size:12px; font-weight:700; color:#1D211F;">100% Authentic Guarantee</p>
                <p style="margin:2px 0 0; font-size:11px; color:#6B726E;">Every formulation is sourced directly from verified global brand partners.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 18px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="middle" style="font-size:18px;">💬</td>
              <td valign="middle" style="padding-left:10px;">
                <p style="margin:0; font-size:12px; font-weight:700; color:#1D211F;">24/7 Dedicated Concierge</p>
                <p style="margin:2px 0 0; font-size:11px; color:#6B726E;">Live assistance via WhatsApp for skincare regimens and order inquiries.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Primary Call to Action Button -->
    <div style="text-align:center; margin-bottom:30px;">
      <a href="${siteUrl}/shop" target="_blank" style="background-color:#183D2B; color:#ffffff; padding:15px 38px; text-decoration:none; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1px; border-radius:6px; display:inline-block; box-shadow:0 2px 10px rgba(24,61,43,0.18);">
        EXPLORE THE COLLECTION &rarr;
      </a>
    </div>

    <!-- Account Details Card -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:1px solid #EDE9DF; border-radius:8px; overflow:hidden;">
      <tr>
        <td style="padding:16px 20px; background-color:#F7F5EF; border-bottom:1px solid #EDE9DF;">
          <p style="margin:0; font-size:11px; font-weight:700; color:#183D2B; text-transform:uppercase; letter-spacing:1px;">
            Your Registered Account Details
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 20px; font-size:12px; color:#5C6460; line-height:1.7;">
          <p style="margin:0 0 6px;"><strong>Member Name:</strong> <span style="color:#1D211F;">${displayName}</span></p>
          <p style="margin:0 0 6px;"><strong>Email Address:</strong> <span style="color:#1D211F;">${email}</span></p>
          <p style="margin:0 0 6px;"><strong>Account Status:</strong> <span style="color:#183D2B; font-weight:600;">Verified Retail Member</span></p>
          <p style="margin:0;"><strong>Member Benefits:</strong> <span style="color:#1D211F;">Fast checkout, saved UAE addresses &amp; real-time tracking</span></p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px; background-color:#FAF8F5; border-top:1px solid #EDE9DF; text-align:center;">
          <a href="${siteUrl}/account?tab=orders" style="color:#183D2B; font-size:12px; font-weight:700; text-decoration:none; margin-right:16px;">
            View My Orders &rarr;
          </a>
          <a href="${siteUrl}/account?tab=addresses" style="color:#183D2B; font-size:12px; font-weight:700; text-decoration:none;">
            Manage Addresses &rarr;
          </a>
        </td>
      </tr>
    </table>
  `, `Welcome to Aurelle, ${displayName}! Your luxury cosmetics account is confirmed.`);

  return sendBrevoEmail({
    to: [{ email, name: fullName || undefined }],
    subject: `Welcome to Aurelle — Your Account is Ready, ${displayName}`,
    htmlContent,
  });
}

// ── 2. Order Confirmation Email (to customer) ──────────────────────

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
    const {
    orderNumber,
    customerName,
    customerEmail,
    items,
    subtotal,
    taxAmount = 0,
    shippingAmount,
    total,
    shippingAddress,
    paymentMethod,
  } = data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayName = customerName?.trim() || "Valued Customer";

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#1D211F; vertical-align:top;">
          ${item.name}${item.sku ? `<br/><span style="color:#8C938F;font-size:11px;">SKU: ${item.sku}</span>` : ""}
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#5C6460; text-align:center; vertical-align:top;">
          x ${item.quantity}
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#1D211F; text-align:right; vertical-align:top; font-weight:600;">
          AED ${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const addressLine = [
    shippingAddress.fullName,
    shippingAddress.streetAddress || shippingAddress.addressLine1,
    shippingAddress.area || shippingAddress.addressLine2,
    shippingAddress.emirate || shippingAddress.city,
    shippingAddress.country || "UAE",
  ]
    .filter(Boolean)
    .join(", ");

  const paymentLabel =
    paymentMethod === "cod"
      ? "Normal Payment (Cash on Delivery)"
      : "Online Payment (Stripe)";

  const htmlContent = emailWrapper(`
    <div style="background:#F0F7F3; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:13px; color:#183D2B; font-weight:600;">Order Confirmed</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:700; color:#1D211F; letter-spacing:0.5px;">${orderNumber}</p>
    </div>
    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 20px;">
      Hi ${displayName}, thank you for your order! We have received it and it is now being processed.
      We will notify you when it is on its way.
    </p>

    <h2 style="font-size:13px; font-weight:700; color:#1D211F; margin:0 0 12px; text-transform:uppercase; letter-spacing:1px;">Order Summary</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tbody>${itemRows}</tbody>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:4px 0;">Subtotal</td>
        <td style="font-size:13px; color:#1D211F; text-align:right; padding:4px 0;">AED ${subtotal.toFixed(2)}</td>
      </tr>
      ${
        taxAmount > 0
          ? `<tr>
        <td style="font-size:13px; color:#5C6460; padding:4px 0;">Tax (5% VAT)</td>
        <td style="font-size:13px; color:#1D211F; text-align:right; padding:4px 0;">AED ${taxAmount.toFixed(2)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:4px 0;">Shipping</td>
        <td style="font-size:13px; color:#1D211F; text-align:right; padding:4px 0;">${shippingAmount === 0 ? "Free" : `AED ${shippingAmount.toFixed(2)}`}</td>
      </tr>
      <tr>
        <td style="font-size:14px; font-weight:700; color:#1D211F; padding:10px 0 4px; border-top:2px solid #EDE9DF;">Total</td>
        <td style="font-size:14px; font-weight:700; color:#183D2B; text-align:right; padding:10px 0 4px; border-top:2px solid #EDE9DF;">AED ${total.toFixed(2)}</td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%; vertical-align:top; padding-right:8px;">
          <div style="background:#F7F5EF; border-radius:6px; padding:14px 16px;">
            <p style="font-size:11px; font-weight:700; color:#8C938F; text-transform:uppercase; letter-spacing:1px; margin:0 0 6px;">Shipping To</p>
            <p style="font-size:13px; color:#1D211F; margin:0; line-height:1.6;">${addressLine}</p>
            ${shippingAddress.phone ? `<p style="font-size:12px; color:#5C6460; margin:4px 0 0;">${shippingAddress.phone}</p>` : ""}
          </div>
        </td>
        <td style="width:50%; vertical-align:top; padding-left:8px;">
          <div style="background:#F7F5EF; border-radius:6px; padding:14px 16px;">
            <p style="font-size:11px; font-weight:700; color:#8C938F; text-transform:uppercase; letter-spacing:1px; margin:0 0 6px;">Payment</p>
            <p style="font-size:13px; color:#1D211F; margin:0;">${paymentLabel}</p>
          </div>
        </td>
      </tr>
    </table>

    <div style="text-align:center; margin-top:28px; margin-bottom:8px;">
      <a href="${siteUrl}/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}" class="btn" style="background:#183D2B; color:#ffffff; padding:14px 32px; text-decoration:none; font-size:13px; font-weight:700; border-radius:4px; display:inline-block; letter-spacing:0.5px; text-transform:uppercase;">Track Your Order</a>
      <p style="margin:12px 0 0; font-size:12px; color:#8C938F;">No login required. View live courier dispatch and delivery updates anytime.</p>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email: customerEmail, name: customerName || undefined }],
    subject: `Order Confirmed - ${orderNumber} | Aurelle`,
    htmlContent,
  });
}

// ── 3. Admin Order Notification ────────────────────────────────────

export async function sendAdminOrderNotificationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("[Brevo] No ADMIN_NOTIFICATION_EMAIL or ADMIN_EMAIL set - skipping admin notification.");
    return { success: false, error: "Admin email not configured." };
  }

  const {
    orderNumber,
    customerName,
    customerEmail,
    items,
    subtotal,
    taxAmount = 0,
    shippingAmount,
    total,
    shippingAddress,
    paymentMethod,
  } = data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#1D211F;">${item.name}</td>
        <td style="padding:8px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#5C6460; text-align:center;">x ${item.quantity}</td>
        <td style="padding:8px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#1D211F; text-align:right; font-weight:600;">AED ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const addressLine = [
    shippingAddress.fullName,
    shippingAddress.streetAddress || shippingAddress.addressLine1,
    shippingAddress.area || shippingAddress.addressLine2,
    shippingAddress.emirate || shippingAddress.city,
    shippingAddress.country || "UAE",
  ]
    .filter(Boolean)
    .join(", ");

  const paymentLabel =
    paymentMethod === "cod"
      ? "Normal Payment (Cash on Delivery)"
      : "Online Payment (Stripe)";

  const htmlContent = emailWrapper(`
    <div style="background:#FFF3CD; border-left:4px solid #856404; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:13px; color:#856404; font-weight:600;">New Order Received</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:700; color:#1D211F;">${orderNumber}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:5px 0; width:130px;">Customer</td>
        <td style="font-size:13px; color:#1D211F; font-weight:600;">${customerName || "-"}</td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:5px 0;">Email</td>
        <td style="font-size:13px; color:#1D211F;">${customerEmail}</td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:5px 0;">Payment</td>
        <td style="font-size:13px; color:#1D211F;">${paymentLabel}</td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:5px 0;">Ship To</td>
        <td style="font-size:13px; color:#1D211F;">${addressLine}</td>
      </tr>
    </table>

    <h2 style="font-size:13px; font-weight:700; color:#1D211F; margin:0 0 10px; text-transform:uppercase; letter-spacing:1px;">Items</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tbody>${itemRows}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:4px 0;">Subtotal</td>
        <td style="font-size:13px; color:#1D211F; text-align:right;">AED ${subtotal.toFixed(2)}</td>
      </tr>
      ${
        taxAmount > 0
          ? `<tr>
        <td style="font-size:13px; color:#5C6460; padding:4px 0;">Tax (5% VAT)</td>
        <td style="font-size:13px; color:#1D211F; text-align:right;">AED ${taxAmount.toFixed(2)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:4px 0;">Shipping</td>
        <td style="font-size:13px; color:#1D211F; text-align:right;">${shippingAmount === 0 ? "Free" : `AED ${shippingAmount.toFixed(2)}`}</td>
      </tr>
      <tr>
        <td style="font-size:14px; font-weight:700; color:#1D211F; padding:10px 0 4px; border-top:2px solid #EDE9DF;">Total</td>
        <td style="font-size:14px; font-weight:700; color:#183D2B; text-align:right; padding:10px 0 4px; border-top:2px solid #EDE9DF;">AED ${total.toFixed(2)}</td>
      </tr>
    </table>

    <div style="text-align:center;">
      <a href="${siteUrl}/admin" class="btn">View in Admin Panel</a>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email: adminEmail, name: "Aurelle Admin" }],
    subject: `New Order ${orderNumber} - AED ${total.toFixed(2)} | Aurelle`,
    htmlContent,
  });
}

// ── 4. Order Delivered & Review Invitation Email ─────────────────────

export interface DeliveredEmailData {
  orderNumber: string;
  customerName?: string;
  customerEmail: string;
  items: Array<{
    productId?: string;
    name: string;
    image?: string | null;
    quantity?: number;
  }>;
  orderId: string;
}

export async function sendOrderDeliveredReviewEmail(
  data: DeliveredEmailData
): Promise<{ success: boolean; error?: string }> {
  const { orderNumber, customerName, customerEmail, items, orderId } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayName = customerName?.trim() || "Valued Customer";
  const token = createReviewToken(orderId, customerEmail);

  const itemRows = items
    .map((item) => {
      const pId = item.productId || "";
      const productReviewLink = `${siteUrl}/review?orderId=${encodeURIComponent(
        orderId
      )}&productId=${encodeURIComponent(pId)}&token=${encodeURIComponent(token)}`;

      return `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid #EDE9DF; font-size:13px; color:#1D211F; vertical-align:middle;">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" width="48" height="48" style="border-radius:6px; object-fit:cover; margin-right:12px; vertical-align:middle; border:1px solid #EDE9DF; display:inline-block;" />`
              : ""
          }
          <strong style="vertical-align:middle;">${item.name}</strong>
          ${
            item.quantity && item.quantity > 1
              ? `<span style="color:#5C6460; font-size:12px; font-weight:normal;"> (x${item.quantity})</span>`
              : ""
          }
        </td>
        <td style="padding:12px 0; border-bottom:1px solid #EDE9DF; text-align:right; vertical-align:middle; white-space:nowrap;">
          <a href="${productReviewLink}" style="background:#183D2B; color:#ffffff; padding:8px 16px; text-decoration:none; font-size:12px; font-weight:700; border-radius:4px; display:inline-block; letter-spacing:0.3px;">
            ★ Review Product
          </a>
        </td>
      </tr>`;
    })
    .join("");

  const mainReviewLink = `${siteUrl}/review?orderId=${encodeURIComponent(
    orderId
  )}${items[0]?.productId ? `&productId=${encodeURIComponent(items[0].productId)}` : ""}&token=${encodeURIComponent(token)}`;

  const htmlContent = emailWrapper(`
    <div style="background:#F0F7F3; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:13px; color:#183D2B; font-weight:600;">Order Delivered</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:700; color:#1D211F;">${orderNumber}</p>
    </div>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      Hi ${displayName}, your Aurelle order has arrived! We hope your luxury pieces bring elegance and radiance to your daily ritual.
    </p>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 20px;">
      Your feedback matters deeply to us and helps fellow connoisseurs discover the perfect beauty essentials. As a registered member, you can now share your authentic review and star rating for each purchased product below.
    </p>

    <div style="background:#FAF8F5; border:1px solid #EDE9DF; border-radius:6px; padding:16px 20px; margin-bottom:24px;">
      <h3 style="margin:0 0 12px; font-size:12px; font-weight:700; color:#183D2B; text-transform:uppercase; letter-spacing:1px;">Delivered Products (${items.length})</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <div style="text-align:center; margin:30px 0 10px;">
      <a href="${mainReviewLink}" class="btn" style="background:#183D2B; color:#ffffff; padding:14px 32px; text-decoration:none; font-size:14px; font-weight:700; border-radius:4px; display:inline-block; letter-spacing:0.5px;">
        ★ ${items.length > 1 ? "Review All Products From This Order" : "Rate & Review Your Product"}
      </a>
    </div>
    <p style="text-align:center; font-size:11px; color:#8C938F; margin:10px 0 0;">
      A registered Aurelle account is required to submit your review.
    </p>
  `);

  return sendBrevoEmail({
    to: [{ email: customerEmail, name: displayName }],
    subject: `Your order ${orderNumber} has arrived! Share your review | Aurelle`,
    htmlContent,
  });
}

// ── 5. Wholesale Enquiry Transactional Emails ───────────────────────

export interface WholesaleEnquiryEmailData {
  contactPerson: string;
  companyName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  categoryName?: string;
  productName?: string;
  quantity?: string;
  message?: string;
}

export async function sendAdminWholesaleEnquiryNotificationEmail(
  data: WholesaleEnquiryEmailData
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("[Brevo] No ADMIN_NOTIFICATION_EMAIL or ADMIN_EMAIL set - skipping admin wholesale notification.");
    return { success: false, error: "Admin email not configured." };
  }

  const {
    contactPerson,
    companyName,
    phone,
    whatsapp,
    email,
    categoryName,
    productName,
    quantity,
    message,
  } = data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayEmail = email && !email.includes("@wholesale.aurelle.ae") ? email : "Not provided";
  const cleanPhone = (whatsapp || phone).replace(/\D/g, "");

  const htmlContent = emailWrapper(`
    <div style="background:#EBF3EF; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:12px; color:#183D2B; font-weight:700; text-transform:uppercase; letter-spacing:1px;">New B2B Wholesale Enquiry</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:700; color:#1D211F;">${companyName}</p>
    </div>

    <h2 style="font-size:13px; font-weight:700; color:#1D211F; margin:0 0 10px; text-transform:uppercase; letter-spacing:1px;">Client Information</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:6px 0; width:140px;">Contact Person</td>
        <td style="font-size:13px; color:#1D211F; font-weight:600;">${contactPerson}</td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:6px 0;">Company / Salon</td>
        <td style="font-size:13px; color:#1D211F; font-weight:600;">${companyName}</td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:6px 0;">Mobile Phone</td>
        <td style="font-size:13px; color:#1D211F;"><a href="tel:${phone}" style="color:#183D2B; text-decoration:none; font-weight:600;">${phone}</a></td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:6px 0;">WhatsApp</td>
        <td style="font-size:13px; color:#1D211F;"><a href="https://wa.me/${cleanPhone}" style="color:#25D366; text-decoration:none; font-weight:600;">${whatsapp || phone}</a></td>
      </tr>
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:6px 0;">Business Email</td>
        <td style="font-size:13px; color:#1D211F;">${displayEmail}</td>
      </tr>
    </table>

    <h2 style="font-size:13px; font-weight:700; color:#1D211F; margin:0 0 10px; text-transform:uppercase; letter-spacing:1px;">Enquiry Requirements</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background:#FAF8F5; border:1px solid #EDE9DF; border-radius:6px; padding:12px 16px;">
      ${
        categoryName
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0; width:140px;">Category</td>
              <td style="font-size:13px; color:#1D211F; font-weight:600;">${categoryName}</td>
            </tr>`
          : ""
      }
      ${
        productName
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0;">Product</td>
              <td style="font-size:13px; color:#1D211F; font-weight:600;">${productName}</td>
            </tr>`
          : ""
      }
      ${
        quantity
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0;">Estimated Units</td>
              <td style="font-size:13px; color:#183D2B; font-weight:700;">${quantity}</td>
            </tr>`
          : ""
      }
      ${
        message
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0; vertical-align:top;">Trade Notes / Destination</td>
              <td style="font-size:13px; color:#1D211F; line-height:1.5;">${message}</td>
            </tr>`
          : ""
      }
    </table>

    <div style="text-align:center; margin-top:20px;">
      <a href="${siteUrl}/admin/wholesale" class="btn">View in Wholesale Admin Portal</a>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email: adminEmail, name: "Aurelle Wholesale Admin" }],
    subject: `New B2B Wholesale Enquiry: ${companyName} (${contactPerson}) | Aurelle`,
    htmlContent,
  });
}

export async function sendClientWholesaleEnquiryConfirmationEmail(
  data: WholesaleEnquiryEmailData
): Promise<{ success: boolean; error?: string }> {
  const { contactPerson, companyName, email, categoryName, productName, quantity, message } = data;

  if (!email || email.includes("@wholesale.aurelle.ae")) {
    return { success: false, error: "No valid client email provided." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayName = contactPerson?.trim() || "Valued Partner";

  const htmlContent = emailWrapper(`
    <div style="background:#EBF3EF; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:12px; color:#183D2B; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Wholesale Enquiry Received</p>
      <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:#1D211F;">Thank You, ${displayName}</p>
    </div>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      Thank you for your commercial interest in partnering with Aurelle Wholesale. We have successfully received your trade enquiry on behalf of <strong>${companyName}</strong>.
    </p>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 20px;">
      Our commercial B2B desk is currently reviewing your product and volume requirements. A procurement specialist will contact you directly via phone or WhatsApp shortly to provide formal quotation, carton breakdown, and logistics arrangements.
    </p>

    <h2 style="font-size:13px; font-weight:700; color:#1D211F; margin:0 0 10px; text-transform:uppercase; letter-spacing:1px;">Summary of Your Enquiry</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background:#FAF8F5; border:1px solid #EDE9DF; border-radius:6px; padding:12px 16px;">
      <tr>
        <td style="font-size:13px; color:#5C6460; padding:5px 0; width:140px;">Company / Salon</td>
        <td style="font-size:13px; color:#1D211F; font-weight:600;">${companyName}</td>
      </tr>
      ${
        categoryName
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0;">Category</td>
              <td style="font-size:13px; color:#1D211F; font-weight:600;">${categoryName}</td>
            </tr>`
          : ""
      }
      ${
        productName
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0;">Product</td>
              <td style="font-size:13px; color:#1D211F; font-weight:600;">${productName}</td>
            </tr>`
          : ""
      }
      ${
        quantity
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0;">Estimated Units</td>
              <td style="font-size:13px; color:#183D2B; font-weight:700;">${quantity}</td>
            </tr>`
          : ""
      }
      ${
        message
          ? `<tr>
              <td style="font-size:13px; color:#5C6460; padding:5px 0; vertical-align:top;">Notes</td>
              <td style="font-size:13px; color:#1D211F; line-height:1.5;">${message}</td>
            </tr>`
          : ""
      }
    </table>

    <div style="background:#F7F5EF; border-radius:6px; padding:14px 18px; margin-bottom:24px;">
      <p style="font-size:12px; font-weight:700; color:#183D2B; margin:0 0 4px; text-transform:uppercase; letter-spacing:0.5px;">Urgent Trade Inquiries?</p>
      <p style="font-size:12px; color:#5C6460; margin:0; line-height:1.6;">
        Reach our Dubai commercial distribution desk directly via WhatsApp or call: <strong style="color:#1D211F;">+971 50 123 4567</strong> or email <a href="mailto:wholesale@aurelle.ae" style="color:#183D2B; text-decoration:none; font-weight:600;">wholesale@aurelle.ae</a>.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${siteUrl}/wholesale" class="btn">Visit Aurelle Wholesale Portal</a>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email, name: displayName }],
    subject: `We've Received Your Wholesale Enquiry | Aurelle B2B (${companyName})`,
    htmlContent,
  });
}

// ── 6. B2B Application Received Email ─────────────────────────────

export async function sendWholesaleApplicationReceivedEmail(data: {
  email: string;
  companyName: string;
  contactPerson: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, companyName, contactPerson } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayName = contactPerson?.trim() || "Valued Partner";

  const htmlContent = emailWrapper(`
    <div style="background:#EBF3EF; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:12px; color:#183D2B; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Application Received</p>
      <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:#1D211F;">B2B Account Application Pending Review</p>
    </div>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      Dear ${displayName},
    </p>
    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      Thank you for submitting your wholesale account application on behalf of <strong>${companyName}</strong>.
      Your application is currently under manual review by our commercial trade desk.
    </p>

    <div style="background:#FAF8F5; border:1px solid #EDE9DF; border-radius:6px; padding:16px 20px; margin-bottom:24px;">
      <p style="font-size:13px; color:#183D2B; font-weight:700; margin:0 0 6px; text-transform:uppercase; letter-spacing:0.5px;">What Happens Next?</p>
      <ul style="margin:0; padding-left:20px; font-size:13px; color:#5C6460; line-height:1.7;">
        <li>Our team will verify your business credentials.</li>
        <li>You created your account password during registration. Please keep it secure.</li>
        <li>Upon approval, you can sign in using <strong>${email}</strong> and the password created during registration.</li>
      </ul>
    </div>

    <div style="text-align:center;">
      <a href="${siteUrl}/wholesale" class="btn">Explore Wholesale Catalog</a>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email, name: displayName }],
    subject: `Wholesale Account Application Received — ${companyName} | Aurelle B2B`,
    htmlContent,
  });
}

// ── 7. B2B Account Approval Email ──────────────────────────────────

export async function sendWholesaleApprovalEmail(data: {
  email: string;
  companyName: string;
  contactPerson: string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, companyName, contactPerson } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayName = contactPerson?.trim() || "Valued Partner";
  const destinationUrl = `${siteUrl}/login?redirect=/wholesale`;

  const htmlContent = emailWrapper(`
    <div style="background:#EBF3EF; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:12px; color:#183D2B; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Application Approved &#10004;</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:700; color:#1D211F;">Welcome to Aurelle Wholesale</p>
    </div>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      Dear ${displayName},
    </p>
    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      We are pleased to inform you that your B2B wholesale account application for <strong>${companyName}</strong> has been officially approved!
    </p>
    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 20px;">
      Your account is now active and has access to verified wholesale pricing, starter MOQs, and dedicated commercial trade features.
    </p>

    <div style="background:#FAF8F5; border:1px solid #EDE9DF; border-radius:6px; padding:16px 20px; margin-bottom:24px;">
      <p style="font-size:13px; font-weight:700; color:#183D2B; margin:0 0 8px;">Account Sign In Details</p>
      <p style="font-size:13px; color:#1D211F; margin:0 0 4px;"><strong>Company:</strong> ${companyName}</p>
      <p style="font-size:13px; color:#1D211F; margin:0 0 4px;"><strong>Email:</strong> ${email}</p>
      <p style="font-size:13px; color:#1D211F; margin:0 0 4px;"><strong>Password:</strong> The password you created during registration</p>
      <p style="font-size:13px; color:#1D211F; margin:0;"><strong>Account Type:</strong> Wholesale Customer</p>
    </div>

    <div style="text-align:center; margin-bottom:24px;">
      <a href="${destinationUrl}" class="btn" style="background:#183D2B; color:#ffffff; padding:14px 32px; text-decoration:none; font-size:14px; font-weight:700; border-radius:4px; display:inline-block; letter-spacing:0.5px;">
        Access Wholesale Account
      </a>
    </div>

    <p style="font-size:12px; color:#8C938F; text-align:center; margin:0;">
      If you ever need to reset your password, click "Forgot Password" on the sign in page.
    </p>
  `);

  return sendBrevoEmail({
    to: [{ email, name: displayName }],
    subject: `Application Approved — Welcome to Aurelle Wholesale (${companyName})`,
    htmlContent,
  });
}

// ── 9. Order Cancellation & Refund Email (to customer) ───────────────

export interface OrderCancelledEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  total: number;
  isOnlinePayment: boolean;
  refundTimeline?: string;
}

export async function sendOrderCancelledEmail(
  data: OrderCancelledEmailData
): Promise<{ success: boolean; error?: string }> {
  const {
    orderNumber,
    customerName,
    customerEmail,
    reason,
    total,
    isOnlinePayment,
    refundTimeline = "5 to 7 UAE banking days",
  } = data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurellecosmeticshop.com";
  const displayName = customerName?.trim() || "Valued Customer";

  const refundDetailsHtml = isOnlinePayment
    ? `
      <div style="background:#F0F7F3; border-left:4px solid #183D2B; padding:14px 18px; border-radius:4px; margin-bottom:20px;">
        <p style="margin:0; font-size:12px; color:#183D2B; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Automated Card Refund Initiated</p>
        <p style="margin:6px 0 0; font-size:16px; font-weight:700; color:#1D211F;">AED ${Number(total).toFixed(2)}</p>
        <p style="margin:6px 0 0; font-size:12px; color:#5C6460; line-height:1.5;">
          A full refund has been initiated via Stripe back to your original payment card. The funds will reflect in your bank account within <strong>${refundTimeline}</strong>.
        </p>
      </div>`
    : `
      <div style="background:#FAF8F5; border-left:4px solid #7C8B82; padding:14px 18px; border-radius:4px; margin-bottom:20px;">
        <p style="margin:0; font-size:12px; color:#183D2B; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Normal Payment (Cash on Delivery)</p>
        <p style="margin:6px 0 0; font-size:13px; color:#5C6460; line-height:1.5;">
          No payment was collected for this order. No charges will be made.
        </p>
      </div>`;

  const htmlContent = emailWrapper(`
    <div style="background:#FFF5F5; border-left:4px solid #C53030; padding:14px 18px; border-radius:4px; margin-bottom:24px;">
      <p style="margin:0; font-size:12px; color:#C53030; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Order Cancelled</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:700; color:#1D211F; letter-spacing:0.5px;">${orderNumber}</p>
    </div>

    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 16px;">
      Dear ${displayName},
    </p>
    <p style="font-size:14px; color:#5C6460; line-height:1.7; margin:0 0 20px;">
      Your cancellation request for Order <strong>${orderNumber}</strong> has been successfully processed. This order will not be dispatched.
    </p>

    <div style="background:#FAF8F5; border:1px solid #EDE9DF; border-radius:6px; padding:16px 20px; margin-bottom:20px;">
      <p style="font-size:12px; font-weight:700; color:#183D2B; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">Cancellation Details</p>
      <p style="font-size:13px; color:#1D211F; margin:0 0 4px;"><strong>Reason:</strong> ${reason}</p>
      <p style="font-size:13px; color:#1D211F; margin:0;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })}</p>
    </div>

    ${refundDetailsHtml}

    <p style="font-size:13px; color:#5C6460; line-height:1.6; margin:0 0 24px;">
      If you changed your mind or need any assistance with another order, our concierge team is always available.
    </p>

    <div style="text-align:center; margin-bottom:24px;">
      <a href="${siteUrl}/shop" class="btn" style="background:#183D2B; color:#ffffff; padding:12px 28px; text-decoration:none; font-size:13px; font-weight:700; border-radius:4px; display:inline-block; letter-spacing:0.5px;">
        Continue Shopping
      </a>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email: customerEmail, name: displayName }],
    subject: `Order ${orderNumber} Cancelled & Refund Initiated — Aurelle`,
    htmlContent,
  });
}





