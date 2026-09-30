import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAdminWholesaleEnquiryNotificationEmail,
  sendWholesaleApplicationReceivedEmail,
} from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let newlyCreatedAuthUserId: string | null = null;
  const admin = createAdminClient();

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
      password,
      confirmPassword,
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

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password and confirm password do not match." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCompanyName = companyName.trim();
    const cleanContactPerson = contactPerson.trim();
    const cleanPhone = phone.trim();
    const cleanCountry = country?.trim() || "United Arab Emirates";
    const cleanBusinessType = businessType?.trim() || "Wholesale Retailer";

    // ─── 2. Existing Account Checks (Rules A, B, C, D) ─────────────────────────

    // Check existing profile in database
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
            "An active wholesale account already exists for this email address. Please log in.",
        },
        { status: 400 }
      );
    }

    if (existingProfile?.role === "wholesale_pending") {
      return NextResponse.json(
        {
          error:
            "Your wholesale application is already pending admin review.",
        },
        { status: 400 }
      );
    }

    if (existingProfile?.role === "customer") {
      return NextResponse.json(
        {
          error:
            "An account with this email address already exists as a retail customer account. Please use a distinct business email address for wholesale registration.",
        },
        { status: 400 }
      );
    }

    // Check existing wholesale applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingApps } = await (admin as any)
      .from("wholesale_applications")
      .select("id, status")
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
              "Your wholesale application is already pending admin review.",
          },
          { status: 400 }
        );
      }
    }

    // Also check auth.users directly to prevent duplicate auth user creation
    const { data: usersList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existingAuthUser = usersList?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingAuthUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email address already exists. Please sign in or use a different business email address.",
        },
        { status: 400 }
      );
    }

    // ─── 3. Create Supabase Auth User with Chosen Password ──────────────────────
    const { data: newUserData, error: createAuthError } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanContactPerson,
          company_name: cleanCompanyName,
          phone: cleanPhone,
          is_wholesale: true,
        },
      });

    if (createAuthError || !newUserData.user) {
      console.error("[Wholesale Register API] createUser error:", createAuthError);
      return NextResponse.json(
        {
          error:
            createAuthError?.message ||
            "Failed to create authentication credentials. Please try again.",
        },
        { status: 400 }
      );
    }

    newlyCreatedAuthUserId = newUserData.user.id;

    // ─── 4. Set Profile Role to 'wholesale_pending' ─────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (admin as any)
      .from("profiles")
      .upsert({
        id: newlyCreatedAuthUserId,
        email: normalizedEmail,
        full_name: cleanContactPerson,
        phone: cleanPhone,
        role: "wholesale_pending",
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("[Wholesale Register API] Profile setup error:", profileError);
      // Rollback Auth user if profile setup fails
      await admin.auth.admin.deleteUser(newlyCreatedAuthUserId).catch((e) =>
        console.error("[Rollback] Delete user error:", e)
      );
      return NextResponse.json(
        { error: "Failed to initialize wholesale application profile." },
        { status: 500 }
      );
    }

    // ─── 5. Insert wholesale_applications Record ────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newApp, error: insertError } = await (admin as any)
      .from("wholesale_applications")
      .insert({
        user_id: newlyCreatedAuthUserId,
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
      console.error("[Wholesale Register API] Application insert error:", insertError);
      // Rollback Auth user if application insertion fails
      await admin.auth.admin.deleteUser(newlyCreatedAuthUserId).catch((e) =>
        console.error("[Rollback] Delete user error:", e)
      );
      return NextResponse.json(
        { error: insertError.message || "Failed to submit B2B application." },
        { status: 500 }
      );
    }

    // ─── 6. Send Transactional Emails (Non-blocking) ────────────────────────────
    // Notice: Brevo email failures do NOT trigger Auth user deletion (Section 6 requirement)
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

    return NextResponse.json({
      success: true,
      applicationId: newApp?.id,
      message:
        "Your wholesale registration application has been submitted successfully with account password setup and is pending admin review.",
    });
  } catch (error: any) {
    console.error("[Wholesale Register API exception]:", error);
    if (newlyCreatedAuthUserId) {
      await admin.auth.admin.deleteUser(newlyCreatedAuthUserId).catch((e) =>
        console.error("[Rollback] Delete user error on exception:", e)
      );
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
