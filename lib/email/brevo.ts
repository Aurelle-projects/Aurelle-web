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

// ── Shared HTML wrapper ────────────────────────────────────────────

const baseStyles = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F7F5EF; margin: 0; padding: 30px; }
  .container { max-width: 560px; margin: 0 auto; background: #ffffff; padding: 40px 36px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .brand { text-align: center; font-family: Georgia, serif; font-size: 26px; color: #183D2B; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 28px; }
  .divider { border: none; border-top: 1px solid #EDE9DF; margin: 24px 0; }
  .footer { font-size: 12px; color: #8C938F; text-align: center; margin-top: 32px; line-height: 1.6; }
  .btn { display: inline-block; padding: 12px 28px; background: #183D2B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 4px; letter-spacing: 0.5px; }
`;

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${baseStyles}</style>
  </head>
  <body>
    <div class="container">
      <div class="brand">AURELLE</div>
      ${body}
      <hr class="divider">
      <div class="footer">
        &copy; ${new Date().getFullYear()} Aurelle. All rights reserved.<br/>
        Luxury beauty, skincare and wellness essentials.
      </div>
    </div>
  </body>
</html>`;
}

// ── 1. Welcome Email ───────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  fullName?: string
): Promise<{ success: boolean; error?: string }> {
  const displayName = fullName?.trim() || "there";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelle.ae";

  const htmlContent = emailWrapper(`
    <div style="text-align:center; margin-bottom:8px;">
      <span style="font-size:40px;">&#127807;</span>
    </div>
    <h1 style="text-align:center; font-size:20px; font-weight:700; color:#1D211F; margin:0 0 12px;">
      Welcome to Aurelle, ${displayName}!
    </h1>
    <p style="font-size:14px; color:#5C6460; line-height:1.7; text-align:center; margin:0 0 24px;">
      Your account has been created successfully. We are thrilled to have you join the Aurelle family &mdash;
      your destination for luxury beauty, skincare, and wellness essentials.
    </p>
    <div style="text-align:center; margin-bottom:28px;">
      <a href="${siteUrl}/shop" class="btn">Start Shopping</a>
    </div>
    <div style="background:#F7F5EF; border-radius:6px; padding:16px 20px;">
      <p style="font-size:13px; color:#5C6460; margin:0; line-height:1.6;">
        <strong style="color:#183D2B;">Your account details</strong><br/>
        Email: <span style="color:#1D211F;">${email}</span>
      </p>
    </div>
  `);

  return sendBrevoEmail({
    to: [{ email, name: fullName || undefined }],
    subject: "Welcome to Aurelle - Your account is ready",
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
    shippingAmount,
    total,
    shippingAddress,
    paymentMethod,
  } = data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelle.ae";
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

  const paymentLabel = "Online Payment (Stripe)";

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

    <div style="text-align:center;">
      <a href="${siteUrl}/account" class="btn">View My Orders</a>
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
    shippingAmount,
    total,
    shippingAddress,
    paymentMethod,
  } = data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelle.ae";

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

  const paymentLabel = "Online Payment (Stripe)";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelle.ae";
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelle.ae";
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurelle.ae";
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



