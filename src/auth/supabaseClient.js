import { createClient } from '@supabase/supabase-js';

// Cloud mode is entirely optional (spec v2.2 §7, §39: "Supabase failure
// must NEVER turn Quan Sát into a broken app"). If the project hasn't been
// configured with real credentials, every consumer of this module must be
// able to treat `supabase` as absent and fall back to guest/local-only
// behavior — nothing in the app may assume it exists.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && anonKey);

export const supabase = isCloudConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Supabase persists the session (incl. refresh token) in
        // localStorage and silently refreshes it in the background, so a
        // returning visit restores the session without re-entering a
        // password — see AuthProvider's session-restore effect and the
        // "30-day login" note in the implementation report.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
