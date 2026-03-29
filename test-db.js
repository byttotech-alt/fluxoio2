const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  console.log('Testing connection...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Select:', { data, error });
  process.exit(0);
}
test();
