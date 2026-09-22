import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, mobile } = await request.json();

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPassword = typeof password === "string" ? password : "";
    const cleanFullName = typeof fullName === "string" ? fullName.trim() : "";
    const cleanMobile = typeof mobile === "string" ? mobile.trim() : "";

    if (!normalizedEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Check if user already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id, email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 400 }
      );
    }

    // Also check auth.users directly in case profile sync was delayed
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const authUserExists = usersList?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (authUserExists) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 400 }
      );
    }

    // Create user with email_confirm: true so NO verification email is triggered!
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanFullName,
        phone: cleanMobile,
      },
    });

    if (createError || !newUserData.user) {
      console.error("[Signup] createUser error:", createError);
      return NextResponse.json(
        { error: createError?.message || "Failed to create account." },
        { status: 400 }
      );
    }

    // Ensure profile entry exists and has phone and full_name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from("profiles")
      .upsert({
        id: newUserData.user.id,
        email: normalizedEmail,
        full_name: cleanFullName || null,
        phone: cleanMobile || null,
        role: "customer",
        updated_at: new Date().toISOString(),
      });

    // Send welcome email (fire-and-forget — don't let email failure break signup)
    sendWelcomeEmail(normalizedEmail, cleanFullName || undefined).catch((err) =>
      console.error("[Signup] Welcome email error:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUserData.user.id,
        email: newUserData.user.email,
      },
    });
  } catch (error) {
    console.error("[Signup] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to process account creation." },
      { status: 500 }
    );
  }
}
