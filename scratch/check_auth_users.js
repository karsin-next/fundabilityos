const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
  if (error) console.error(error);
  else {
    const sorted = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    console.log(JSON.stringify(sorted.slice(0, 10).map(u => ({ email: u.email, created_at: u.created_at })), null, 2));
  }
}

checkAuthUsers();
