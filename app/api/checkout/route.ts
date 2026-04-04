import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { reportId, userId } = await req.json();

    if (!reportId || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Investor-Ready Report Unlock",
              description: "Complete PDF, Private Share Link, and 30-Day Growth Plan.",
              images: [`${appUrl}/assets/og-image.png`], // Optional branding
            },
            unit_amount: 2900, // $29.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        report_id: reportId,
        user_id: userId,
      },
      mode: "payment",
      success_url: `${appUrl}/checkout/success?report_id=${reportId}`,
      cancel_url: `${appUrl}/report/${reportId}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
