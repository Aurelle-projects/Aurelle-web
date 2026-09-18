// ============================================================
// AURELLE — SUPABASE ADMIN CLIENT (SERVICE ROLE)
// ⚠️  SERVER ONLY — NEVER import this in client components.
// ⚠️  NEVER expose SUPABASE_SECRET_KEY to the browser.
// Used for: webhook processing, admin actions, RLS-bypassing
// operations that require elevated privileges.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Singleton admin client — safe in serverless (request-scoped env)
let adminClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  // In serverless environments each invocation is fresh,
  // but we still guard with a module-level singleton.
  if (adminClientInstance) return adminClientInstance;

  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. This must be a server-only environment variable."
    );
  }

  adminClientInstance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClientInstance;
}
