// ============================================================
// AURELLE — WHOLESALE CATALOG SETTINGS UTILITY
// Manages wholesale category and brand availability across DB and site_settings
// ============================================================

import { SupabaseClient } from "@supabase/supabase-js";

export interface WholesaleCatalogSettings {
  enabled_category_ids: string[];
  enabled_brand_ids: string[];
}

export async function getWholesaleCatalogSettings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<WholesaleCatalogSettings> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "wholesale_catalog")
      .maybeSingle();

    if (data?.value && typeof data.value === "object") {
      const val = data.value as Partial<WholesaleCatalogSettings>;
      return {
        enabled_category_ids: Array.isArray(val.enabled_category_ids)
          ? val.enabled_category_ids
          : [],
        enabled_brand_ids: Array.isArray(val.enabled_brand_ids)
          ? val.enabled_brand_ids
          : [],
      };
    }
  } catch (err) {
    console.error("Error reading wholesale_catalog site_settings:", err);
  }

  return { enabled_category_ids: [], enabled_brand_ids: [] };
}

export async function setWholesaleCategoryAvailability(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  categoryId: string,
  isWholesale: boolean
) {
  try {
    // Try updating DB column first if present
    try {
      await supabase
        .from("categories")
        .update({ is_wholesale: isWholesale })
        .eq("id", categoryId);
    } catch {
      // Column may not exist yet
    }

    // Always sync site_settings for robustness
    const current = await getWholesaleCatalogSettings(supabase);
    const set = new Set(current.enabled_category_ids);
    if (isWholesale) {
      set.add(categoryId);
    } else {
      set.delete(categoryId);
    }

    await supabase.from("site_settings").upsert(
      {
        key: "wholesale_catalog",
        value: {
          enabled_category_ids: Array.from(set),
          enabled_brand_ids: current.enabled_brand_ids,
        },
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.error("Error updating wholesale category availability:", err);
  }
}

export async function setWholesaleBrandAvailability(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  brandId: string,
  isWholesale: boolean
) {
  try {
    // Try updating DB column first if present
    try {
      await supabase
        .from("brands")
        .update({ is_wholesale: isWholesale })
        .eq("id", brandId);
    } catch {
      // Column may not exist yet
    }

    // Always sync site_settings for robustness
    const current = await getWholesaleCatalogSettings(supabase);
    const set = new Set(current.enabled_brand_ids);
    if (isWholesale) {
      set.add(brandId);
    } else {
      set.delete(brandId);
    }

    await supabase.from("site_settings").upsert(
      {
        key: "wholesale_catalog",
        value: {
          enabled_category_ids: current.enabled_category_ids,
          enabled_brand_ids: Array.from(set),
        },
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.error("Error updating wholesale brand availability:", err);
  }
}
