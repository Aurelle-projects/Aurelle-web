import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAdminWholesaleEnquiryNotificationEmail,
  sendClientWholesaleEnquiryConfirmationEmail,
} from "@/lib/email/brevo";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`wholesale-enquiry:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many enquiries submitted. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
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
    } = body;

    if (!contactPerson?.trim()) {
      return NextResponse.json(
        { error: "Contact person name is required" },
        { status: 400 }
      );
    }

    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: "Company or business name is required" },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Phone / mobile number is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Email is not mandatory per user request. Fallback if empty to satisfy non-null column
    const cleanPhone = phone.replace(/\D/g, "") || Date.now().toString();
    const finalEmail =
      email && email.trim()
        ? email.trim()
        : `trade-${cleanPhone}@wholesale.aurelle.ae`;

    const notesSummary = [
      `[Wholesale Product Enquiry]`,
      whatsapp?.trim() ? `WhatsApp: ${whatsapp.trim()}` : null,
      categoryName?.trim() ? `Selected Category: ${categoryName.trim()}` : null,
      productName?.trim() ? `Selected Product: ${productName.trim()}` : null,
      quantity?.trim() ? `Estimated Quantity / Cartons: ${quantity.trim()}` : null,
      message?.trim() ? `Message: ${message.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("wholesale_enquiries")
      .insert({
        company_name: companyName.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email && email.trim() ? email.trim() : null,
        whatsapp: whatsapp && whatsapp.trim() ? whatsapp.trim() : null,
        category_name: categoryName && categoryName.trim() ? categoryName.trim() : null,
        product_name: productName && productName.trim() ? productName.trim() : null,
        quantity: quantity && quantity.trim() ? quantity.trim() : null,
        message: message && message.trim() ? message.trim() : null,
        notes: notesSummary,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[Wholesale Enquiry API insert error]:", error);
      return NextResponse.json(
        { error: error.message || "Failed to submit enquiry" },
        { status: 500 }
      );
    }

    // Auto-send emails to admin and client (non-blocking)
    try {
      const emailPayload = {
        contactPerson: contactPerson.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp?.trim() || phone.trim(),
        email: email?.trim() || undefined,
        categoryName: categoryName?.trim() || undefined,
        productName: productName?.trim() || undefined,
        quantity: quantity?.trim() || undefined,
        message: message?.trim() || undefined,
      };

      // 1. Notify Admin
      sendAdminWholesaleEnquiryNotificationEmail(emailPayload).catch((e) =>
        console.error("[Email] Admin wholesale notification error:", e)
      );

      // 2. Notify Client (if email provided)
      if (email && email.trim() && !email.includes("@wholesale.aurelle.ae")) {
        sendClientWholesaleEnquiryConfirmationEmail(emailPayload).catch((e) =>
          console.error("[Email] Client wholesale confirmation error:", e)
        );
      }
    } catch (emailErr) {
      console.error("[Email] Wholesale email dispatcher exception:", emailErr);
    }

    return NextResponse.json({
      success: true,
      enquiryId: data?.id,
      message: "Wholesale enquiry received successfully.",
    });
  } catch (err: any) {
    console.error("[Wholesale Enquiry API exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
