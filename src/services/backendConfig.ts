export const SUPABASE_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL?.trim() &&
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
)
