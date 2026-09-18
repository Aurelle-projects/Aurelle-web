import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if categories table exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: checkErr } = await (supabase as any)
      .from("categories")
      .select("id")
      .limit(1);

    if (checkErr) {
      return NextResponse.json({
        success: false,
        error: "Table 'categories' not found in database. Please apply the migrations first in Supabase SQL Editor.",
        migrationFile: "supabase/migrations/20260917_004_seed_categories.sql",
      }, { status: 400 });
    }

    let insertedParents = 0;
    let insertedSubs = 0;

    for (const cat of AURELLE_CATEGORIES) {
      // Upsert parent category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: parent, error: pErr } = await (supabase as any)
        .from("categories")
        .upsert(
          {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            sort_order: cat.sort_order,
            is_active: true,
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();

      if (pErr || !parent?.id) {
        console.error("Failed to insert parent category:", cat.name, pErr);
        continue;
      }

      insertedParents++;

      // Insert subcategories
      for (const sub of cat.subcategories) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: sErr } = await (supabase as any)
          .from("categories")
          .upsert(
            {
              name: sub.name,
              slug: sub.slug,
              parent_id: parent.id,
              sort_order: sub.sort_order,
              is_active: true,
            },
            { onConflict: "slug" }
          );

        if (!sErr) insertedSubs++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedParents} main categories and ${insertedSubs} subcategories.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Seeding failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
