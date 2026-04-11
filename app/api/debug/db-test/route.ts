import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const diagnosticResults: any = {
    timestamp: new Date().toISOString(),
    env: {
      supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_role_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      service_role_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      service_role_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5) + "...",
    },
    checks: {},
  };

  try {
    const supabaseAdmin = createServiceClient();
    
    // Check 1: Can we read from profiles?
    console.log("[Diagnostic] Attempting to read from profiles...");
    const { data: readData, error: readError } = await supabaseAdmin
      .from("profiles")
      .select("count", { count: 'exact', head: true });
    
    diagnosticResults.checks.read_profiles = {
      success: !readError,
      data: readData,
      error: readError,
    };

    // Check 2: Check schema columns (simple select)
    console.log("[Diagnostic] Attempting to fetch one profile to check columns...");
    const { data: columnData, error: columnError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .limit(1);
    
    diagnosticResults.checks.get_columns = {
      success: !columnError,
      keys: columnData && columnData[0] ? Object.keys(columnData[0]) : [],
      error: columnError,
    };

    // Check 3: Attempt a test insert with dummy UUID
    // We use a random UUID that definitely doesn't exist in auth.users
    // This SHOULD fail with a foreign key violation if the ID check is working,
    // but if it fails with "column does not exist", that's our bug!
    const dummyId = "00000000-0000-0000-0000-000000000000";
    console.log("[Diagnostic] Attempting dummy insert to check for column errors...");
    const { error: insertError } = await (supabaseAdmin.from("profiles") as any).insert({
      id: dummyId,
      email: "diagnostic@test.com",
      full_name: "Diagnostic Test",
      role: "startup" 
    });

    diagnosticResults.checks.dummy_insert_test = {
      error: insertError,
      is_foreign_key_violation: insertError?.code === '23503',
      is_column_missing_error: insertError?.message?.includes("column") || insertError?.code === '42703',
    };

  } catch (err: any) {
    diagnosticResults.fatal_error = {
      message: err.message,
      stack: err.stack,
    };
  }

  return NextResponse.json(diagnosticResults);
}
