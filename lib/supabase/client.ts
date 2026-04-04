import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a typed stub during local dev without .env.local
    // All auth calls will gracefully fail with a clear message
    console.warn(
      "[FundabilityOS] Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
    return {
      auth: {
        signInWithPassword: async () => ({ error: { message: "Supabase not configured yet." } }),
        signInWithOtp: async () => ({ error: { message: "Supabase not configured yet." } }),
        signUp: async () => ({ error: { message: "Supabase not configured yet." } }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  return createBrowserClient<Database>(url, key);
}
