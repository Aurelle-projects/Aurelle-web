import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!await verifyAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "";
    const brand = searchParams.get("brand") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Get total count of products to generate sequential serial base
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });

    const totalCount = (count || 0) + 1;

    // Determine clean prefix from brand or product name
    let prefix = "AUR";
    if (brand && brand.trim().length >= 3) {
      const cleanBrand = brand.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      prefix = `AUR-${cleanBrand.slice(0, 4) || "BRD"}`;
    } else if (name && name.trim().length >= 3) {
      const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      prefix = `AUR-${cleanName.slice(0, 4) || "PRD"}`;
    } else {
      prefix = "AUR-PRD";
    }

    // Candidate sequential serial number (e.g. AUR-CERA-0039 or AUR-PRD-0039)
    let candidate = `${prefix}-${String(totalCount).padStart(4, "0")}`;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", candidate)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
        const nextSeq = totalCount + attempts;
        const randomSalt = Math.floor(100 + Math.random() * 900);
        candidate = `${prefix}-${String(nextSeq).padStart(4, "0")}-${randomSalt}`;
      }
    }

    return NextResponse.json({
      success: true,
      sku: candidate,
      serialNumber: candidate,
    });
  } catch (error: any) {
    console.error("[generate-sku] Error generating unique serial number:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate serial number" },
      { status: 500 }
    );
  }
}
