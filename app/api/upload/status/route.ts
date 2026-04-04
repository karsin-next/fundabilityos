import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // In a real implementation:
  // 1. Check database for extraction job status
  // 2. If complete, return the extracted JSON
  
  // Simulate extraction latency
  await new Promise((r) => setTimeout(r, 800));
  
  return NextResponse.json({
    status: "done",
    extracted_data: {
      company_name: "Demo Startup",
      problem: "Restaurants lose 10-15% of revenue to unseen food waste.",
      solution: "AI-powered waste tracking and inventory optimization.",
      market_size: "$2B TAM in Southeast Asia",
      revenue_model: "$199/mo SaaS subscription",
      monthly_revenue: "$0 (Pre-revenue)",
      team: "2 co-founders (ex-Grab, ex-Foodpanda)",
      funding_ask: "$500k Seed",
      missing_fields: ["monthly_revenue"], // Force one missing field to demo the warning UI
    }
  });
}
