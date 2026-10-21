import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Null when env vars are missing: the app then runs in local demo mode.
export const supabase = url && key ? createClient(url, key) : null;
