import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import FooterWrapper from "@/components/layout/FooterWrapper";
// removed AuthProvider import
import ChatWidget from "@/components/support/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "FundabilityOS — Know Your Investor-Ready Score",
    template: "%s | FundabilityOS",
  },
  description:
    "Answer 12 AI questions or upload your pitch deck. Get a Fundability Score (0–100) and know exactly what investors will push back on. Built for Southeast Asian founders.",
  keywords: [
    "fundability score",
    "investor readiness",
    "startup fundraising",
    "Southeast Asia startup",
    "pitch deck assessment",
    "investor ready",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FundabilityOS",
    title: "FundabilityOS — Know Your Investor-Ready Score",
    description:
      "Get your Fundability Score in 10 minutes. Fix your gaps before investors find them.",
    images: [{ url: "/assets/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FundabilityOS — Know Your Investor-Ready Score",
    description: "Get your Fundability Score in 10 minutes.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

import { AuthProvider } from "@/lib/hooks/useUser";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <FooterWrapper />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
