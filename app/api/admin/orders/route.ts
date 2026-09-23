import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("orders")
      .select(`
        id,
        order_number,
        customer_email,
        customer_type,
        total,
        subtotal,
        status,
        payment_status,
        created_at,
        shipping_address,
        order_items ( id, product_snapshot, quantity, line_total )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Orders API] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orders: data || [],
    });
  } catch (err) {
    console.error("[Admin Orders API] exception:", err);
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
