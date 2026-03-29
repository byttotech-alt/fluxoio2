import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 CRITICAL: Missing Supabase environment variables!',
    '\nVITE_SUPABASE_URL:', supabaseUrl ? '✅ set' : '❌ MISSING',
    '\nVITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ set' : '❌ MISSING',
    '\nThe app will show the login page but auth will not work.',
    '\nAdd these to your .env file locally or to Vercel Environment Variables for deployment.'
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

