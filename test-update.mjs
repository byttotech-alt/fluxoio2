import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'arthur_test_1763952@gmail.com', // wait, I don't know the exact test email from before
    password: 'password123'
  });
  process.exit(0);
}
test();
