const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('id, created_at, score, user_id')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkRecentReports();
