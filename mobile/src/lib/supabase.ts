import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { storage } from "./storage";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
  key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const socialReady = Boolean(url && key);
export const supabase = socialReady
  ? createClient(url!, key!, {
      auth: {
        storage,
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
