import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    version: "4.1-STABLE-20240418",
    environment: process.env.NODE_ENV,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^(https:\/\/)([^\.]+)(\..+)$/, "$1***$3"),
    timestamp: new Date().toISOString()
  });
}
