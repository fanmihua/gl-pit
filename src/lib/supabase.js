import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isCommunityConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isCommunityConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
    })
  : null;

let sessionPromise = null;

export async function ensureCommunitySession() {
  if (!supabase) throw new Error("互动服务尚未配置");
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (sessionData.session) return sessionData.session;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.session;
  })();

  try {
    return await sessionPromise;
  } finally {
    sessionPromise = null;
  }
}

export function resetCommunitySessionPromise() {
  sessionPromise = null;
}
