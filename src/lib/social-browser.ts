import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const socialConfigured = Boolean(url && key);
let client: ReturnType<typeof createClient> | undefined;
export function socialBrowser() {
  if (!url || !key) throw Error("Social sign-in is not configured yet");
  return (client ??= createClient(url, key, {
    auth: { flowType: "pkce", detectSessionInUrl: false },
  }));
}
