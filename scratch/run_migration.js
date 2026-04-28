const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Running migration: adding user_email to sessions...");
  
  const { error: colError } = await supabase.rpc('execute_sql', {
    sql: `ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_email TEXT;`
  });

  if (colError) {
    console.error("RPC execute_sql might not be available. Trying direct query if possible...");
    // Since I can't run arbitrary SQL easily via the JS client without a custom RPC,
    // I'll have to ask the user or try to find if they have a 'direct' way.
    
    // Wait! I can check if they have a 'sql' table or something? No.
    console.error(colError);
  } else {
    console.log("Success!");
  }
}

// Alternatively, I can use a simpler approach if RPC is not available.
// But wait, most Supabase setups don't have 'execute_sql' RPC by default.

console.log("Migration script ready. Please apply the migration manually or ensure the 'execute_sql' RPC exists.");
