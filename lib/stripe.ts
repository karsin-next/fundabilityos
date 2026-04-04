import Stripe from "stripe";

// Initialize the Stripe SDK single instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_fallback_for_build", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2026-03-25.dahlia" as any, // Use the latest API version or your account's default
  appInfo: {
    name: "FundabilityOS",
    version: "0.1.0",
  },
});
