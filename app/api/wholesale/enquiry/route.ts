import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAdminWholesaleEnquiryNotificationEmail,
  sendClientWholesaleEnquiryConfirmationEmail,
} from "@/lib/email/brevo";

export async function POST(request: Request) {
  try {
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
      .from("wholesale_applications")
      .insert({
        business_name: companyName.trim(),
        contact_person: contactPerson.trim(),
        email: finalEmail,
        phone: phone.trim(),
        country: "United Arab Emirates",
        business_type: "Wholesale Trade Enquiry",
        expected_order_volume: quantity?.trim() || "Wholesale MOQ",
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

    // Also create order in orders table so it displays in Wholesale B2B on /admin/orders
    try {
      const appId = data?.id;
      const orderNumber = `B2B-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const parsedQty = parseInt(String(quantity || "").replace(/\D/g, ""), 10) || 1;
      const itemPrice = Number(body.price) || 0;
      const lineTotal = itemPrice * parsedQty;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newOrder } = await (admin as any)
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_email: finalEmail,
          customer_type: "wholesale",
          status: "pending",
          payment_status: "pending",
          subtotal: lineTotal,
          total: lineTotal,
          discount_amount: 0,
          shipping_amount: 0,
          tax_amount: 0,
          shipping_address: {
            fullName: contactPerson.trim(),
            companyName: companyName.trim(),
            phone: phone.trim(),
            city: "Dubai",
            country: "United Arab Emirates",
          },
          notes: `[Wholesale Application ID: ${appId || ""}]\n${notesSummary}`,
        })
        .select()
        .single();

      if (newOrder && (productName?.trim() || body.productId)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("order_items").insert({
          order_id: newOrder.id,
          product_id: body.productId || null,
          product_snapshot: {
            name: productName?.trim() || "Wholesale B2B Consignment",
            image: body.image || null,
            category: categoryName?.trim() || "",
          },
          sku_snapshot: body.sku || "B2B-WHOLESALE",
          price_snapshot: itemPrice,
          quantity: parsedQty,
          line_total: lineTotal,
        });
      }
    } catch (orderErr) {
      console.warn("[Wholesale Enquiry API] Order creation error (non-fatal):", orderErr);
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
