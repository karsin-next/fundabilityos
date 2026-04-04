import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side streaming for Claude SSE responses
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Vercel Cron Jobs — twice daily self-evolution
  // vercel.json handles cron scheduling
};

export default nextConfig;
