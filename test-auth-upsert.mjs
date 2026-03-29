import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const testEmail = 'arthur_test_' + Date.now() + '@gmail.com';
async function test() {
  console.log('Signing up...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123'
  });
  if (authError) return console.error(authError);
  
  const userId = authData.user.id;
  console.log('User signed up:', userId);
  console.log('Attempting UPSERT...');
  const { data, error } = await supabase.from('profiles').upsert({ id: userId, company_name: 'Auth Test' }).select().single();
  console.log('UPSERT result:', { data, error });
  process.exit(0);
}
test();
