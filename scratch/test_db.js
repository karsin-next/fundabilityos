const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Testing connection to:', url);

  const supabase = createClient(url, key);
  
  const { data, error } = await supabase
    .from('calibration_log')
    .select('count', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connection successful! Found calibration_log table.');
  }
}

test();
