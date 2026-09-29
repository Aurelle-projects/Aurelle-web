import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAdminWholesaleEnquiryNotificationEmail,
  sendWholesaleApplicationReceivedEmail,
} from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      country,
      businessType,
      expectedOrderVolume,
      tradeLicenseUrl,
      notes,
    } = body;

    // ─── 1. Validation ──────────────────────────────────────────────────────────
    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: "Company or business name is required." },
        { status: 400 }
      );
    }

    if (!contactPerson?.trim()) {
      return NextResponse.json(
        { error: "Contact person name is required." },
        { status: 400 }
      );
    }

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid business email address is required." },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Phone / mobile number is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCompanyName = companyName.trim();
    const cleanContactPerson = contactPerson.trim();
    const cleanPhone = phone.trim();
    const cleanCountry = country?.trim() || "United Arab Emirates";
    const cleanBusinessType = businessType?.trim() || "Wholesale Retailer";

    const admin = createAdminClient();

    // ─── 2. Duplicate Handling (Phase 7 Requirements) ───────────────────────────

    // Check existing profiles for this email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (admin as any)
      .from("profiles")
      .select("id, email, role")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile?.role === "wholesale_customer") {
      return NextResponse.json(
        {
          error:
            "An active wholesale customer account already exists for this email. Please log in.",
        },
        { status: 400 }
      );
    }

    // Check existing applications for this email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingApps } = await (admin as any)
      .from("wholesale_applications")
      .select("id, status, created_at")
      .ilike("email", normalizedEmail)
      .order("created_at", { ascending: false });

    if (Array.isArray(existingApps) && existingApps.length > 0) {
      const activePending = existingApps.find(
        (app: { status: string }) =>
          app.status === "pending" || app.status === "under_review"
      );

      if (activePending) {
        return NextResponse.json(
          {
            error:
              "A wholesale application for this email address is currently pending review. Our team will contact you shortly.",
          },
          { status: 400 }
        );
      }

      const activeApproved = existingApps.find(
        (app: { status: string }) => app.status === "approved"
      );

      if (activeApproved) {
        return NextResponse.json(
          {
            error:
              "An approved wholesale application already exists for this email address. Please sign in.",
          },
          { status: 400 }
        );
      }
    }

    // ─── 3. Store Application as PENDING ────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newApp, error: insertError } = await (admin as any)
      .from("wholesale_applications")
      .insert({
        user_id: existingProfile?.id || null,
        business_name: cleanCompanyName,
        contact_person: cleanContactPerson,
        email: normalizedEmail,
        phone: cleanPhone,
        country: cleanCountry,
        business_type: cleanBusinessType,
        expected_order_volume: expectedOrderVolume?.trim() || null,
        trade_license_url: tradeLicenseUrl?.trim() || null,
        notes: notes?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Wholesale Register API] Insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to submit B2B application." },
        { status: 500 }
      );
    }

    // ─── 4. Send Confirmation & Admin Notification Email (Non-blocking) ─────────
    try {
      sendAdminWholesaleEnquiryNotificationEmail({
        contactPerson: cleanContactPerson,
        companyName: cleanCompanyName,
        phone: cleanPhone,
        email: normalizedEmail,
        categoryName: cleanBusinessType,
        quantity: expectedOrderVolume?.trim() || "Standard B2B MOQ",
        message: `New B2B Account Registration Application submitted.\nCountry: ${cleanCountry}\nNotes: ${notes || "None"}`,
      }).catch((e) => console.error("[Email] Admin notification error:", e));

      sendWholesaleApplicationReceivedEmail({
        email: normalizedEmail,
        companyName: cleanCompanyName,
        contactPerson: cleanContactPerson,
      }).catch((e) => console.error("[Email] Client application received email error:", e));
    } catch (emailErr) {
      console.warn("[Wholesale Register API] Email notification warning:", emailErr);
    }

    const isExistingRetailUser = existingProfile?.role === "customer";
    const responseMessage = isExistingRetailUser
      ? "Your wholesale application has been submitted for admin review. Your existing retail account will be upgraded upon approval."
      : "Your wholesale registration application has been submitted successfully and is pending admin review.";

    return NextResponse.json({
      success: true,
      applicationId: newApp?.id,
      message: responseMessage,
    });
  } catch (error: any) {
    console.error("[Wholesale Register API exception]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
