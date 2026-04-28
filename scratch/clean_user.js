const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUser(email) {
  console.log(`Cleaning user with email: ${email}`);
  
  // 1. Get user id from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
    
  if (profileError) {
    console.error("Profile not found:", profileError.message);
    // Try to get from auth.users directly?
  }

  const userId = profile?.id;

  if (userId) {
    console.log(`Deleting data for user ID: ${userId}`);
    
    // Delete from profiles (will cascade if FKs set to cascade)
    const { error: delProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (delProfileError) console.error("Error deleting profile:", delProfileError.message);
    else console.log("Profile deleted.");
  }

  // 2. Delete from auth.users via admin API
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const authUser = users?.find(u => u.email === email);
  
  if (authUser) {
    console.log(`Deleting auth user: ${authUser.id}`);
    const { error: delAuthError } = await supabase.auth.admin.deleteUser(authUser.id);
    if (delAuthError) console.error("Error deleting auth user:", delAuthError.message);
    else console.log("Auth user deleted.");
  } else {
    console.log("Auth user not found.");
  }
  
  // 3. Clean up orphaned sessions/reports with this email
  const { error: delSessionsError } = await supabase
    .from('sessions')
    .delete()
    .eq('user_email', email);
    
  if (delSessionsError) console.error("Error deleting sessions:", delSessionsError.message);
  else console.log("Orphaned sessions cleaned.");

  console.log("Cleanup complete.");
}

const emailToClean = process.argv[2];
if (!emailToClean) {
  console.log("Please provide an email as argument.");
} else {
  cleanUser(emailToClean);
}
