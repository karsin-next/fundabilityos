import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Fundability Interview",
  description: "Answer 12 questions to get your investor-readiness score. Powered by Claude AI.",
};

/**
 * Interview and upload pages get their own layout — no Footer.
 * The Navbar still renders from the root layout.
 * We wrap in a fragment so the root layout's <main> handles the outer shell.
 */
export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
