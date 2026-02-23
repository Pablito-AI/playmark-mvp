import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function closeExpiredMarkets() {
  try {
    const supabase = createSupabaseServiceClient();
    await supabase.rpc("close_expired_markets");
  } catch {
    // Allow local rendering before env vars are configured.
  }
}
