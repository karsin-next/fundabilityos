import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToStream } from "@react-pdf/renderer";
import FundabilityReportPDF from "@/components/pdf/FundabilityReportPDF";
import React from "react";

// @react-pdf/renderer uses heavy Node-native dependencies
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the report from the DB
    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !report) {
      return new NextResponse("Report not found", { status: 404 });
    }

    // Security Check: Only allow PDF export if the report is unlocked (paid)
    if (!report.is_unlocked) {
      return new NextResponse("Payment required to download PDF", { status: 403 });
    }

    // Render the React component to a Node stream
    const pdfStream = await renderToStream(
      React.createElement(FundabilityReportPDF, { report }) as any
    );

    // Convert string stream to standard Response
    return new NextResponse(pdfStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FundabilityOS_Report_${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Export Error:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
