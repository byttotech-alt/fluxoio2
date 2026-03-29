import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error(
    '🚨 CRITICAL: Missing or invalid Supabase environment variables!',
    '\nVITE_SUPABASE_URL:', supabaseUrl && !supabaseUrl.includes('placeholder') ? '✅ set' : '❌ MISSING/INVALID',
    '\nVITE_SUPABASE_ANON_KEY:', supabaseAnonKey && supabaseAnonKey !== 'placeholder-key' ? '✅ set' : '❌ MISSING/INVALID',
    '\nThe app will show the loading screen for 5s and then fallback to login.',
    '\nCheck Vercel Project Settings > Environment Variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

