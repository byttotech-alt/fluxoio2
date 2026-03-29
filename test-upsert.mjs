import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const testId = '00000000-0000-0000-0000-000000000000';
console.log('Testing UPSERT...');
supabase.from('profiles').upsert({ id: testId, company_name: 'Hang Test' }).select().single()
  .then(console.log)
  .catch(console.error);
