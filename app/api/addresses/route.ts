import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── Ensure a profile row exists for the auth user (FK guard) ──────
async function ensureProfile(admin: ReturnType<typeof createAdminClient>, user: User) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) ?? null,
        phone: (user.user_metadata?.phone as string) ?? null,
        role: "customer",
      },
      { onConflict: "id" }
    );
}

// ── GET: List user's saved addresses ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: addresses, error } = await (admin as any)
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Addresses GET error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ addresses: addresses || [] });
  } catch (err) {
    console.error("[Addresses GET exception]:", err);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// ── POST: Create or Update address ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = "AE",
      isDefault = false,
    } = body;

    if (!fullName || !addressLine1 || !city) {
      return NextResponse.json(
        { error: "Full name, street address, and city/emirate are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Ensure the profile row exists before any address write (FK guard)
    await ensureProfile(admin, user);

    // Check how many addresses exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingAddresses } = await (admin as any)
      .from("addresses")
      .select("id, is_default")
      .eq("user_id", user.id);

    const hasNoAddresses = !existingAddresses || existingAddresses.length === 0;
    const shouldBeDefault = isDefault || hasNoAddresses;

    // If setting this one as default, unset existing defaults first
    if (shouldBeDefault) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    if (id) {
      // Update existing address
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await (admin as any)
        .from("addresses")
        .update({
          label: label?.trim() || null,
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
          address_line1: addressLine1.trim(),
          address_line2: addressLine2?.trim() || null,
          city: city.trim(),
          state: state?.trim() || city.trim(),
          postal_code: postalCode?.trim() || null,
          country: country.trim(),
          is_default: shouldBeDefault,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, address: updated });
    } else {
      // Insert new address
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error } = await (admin as any)
        .from("addresses")
        .insert({
          user_id: user.id,
          label: label?.trim() || "Home",
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
          address_line1: addressLine1.trim(),
          address_line2: addressLine2?.trim() || null,
          city: city.trim(),
          state: state?.trim() || city.trim(),
          postal_code: postalCode?.trim() || null,
          country: country.trim(),
          is_default: shouldBeDefault,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, address: inserted });
    }
  } catch (err) {
    console.error("[Addresses POST exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save address." },
      { status: 500 }
    );
  }
}

// ── PATCH: Set an address as default ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Reset other defaults
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    // Set this address as default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (admin as any)
      .from("addresses")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, address: updated });
  } catch (err) {
    console.error("[Addresses PATCH exception]:", err);
    return NextResponse.json({ error: "Failed to update default address" }, { status: 500 });
  }
}

// ── DELETE: Delete address ────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if the deleted address was default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: target } = await (admin as any)
      .from("addresses")
      .select("is_default")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (admin as any)
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // If it was default, make another address default
    if (target?.is_default) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: remaining } = await (admin as any)
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (remaining && remaining.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remaining[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Addresses DELETE exception]:", err);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
