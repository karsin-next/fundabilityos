import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side streaming for Claude SSE responses
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],

  // Silence lint warnings during production build (errors are still surfaced)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow larger PDF uploads (up to 10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

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
