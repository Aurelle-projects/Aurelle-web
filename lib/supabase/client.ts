// ============================================================
// AURELLE — SUPABASE BROWSER CLIENT
// Use in Client Components ("use client") only.
// Uses anon key — subject to RLS policies.
// ============================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
