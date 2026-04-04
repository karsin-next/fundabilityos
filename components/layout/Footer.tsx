import Link from "next/link";

const footerLinks = {
  Platform: [
    { href: "/interview", label: "Get Your Score" },
    { href: "/upload", label: "Upload Pitch Deck" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/directory", label: "Investor Directory" },
  ],
  Company: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "mailto:karsin@nextblaze.asia", label: "Contact" },
    { href: "https://nextblaze.asia", label: "NextBlaze" },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--navy)",
        borderTop: "1px solid var(--yellow-20)",
      }}
    >
      {/* Yellow full-width stripe — NextBlaze signature */}
      <div style={{ width: "100%", height: "3px", backgroundColor: "var(--yellow)" }} />

      <div className="container" style={{ paddingBlock: "4rem 2rem" }}>
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: "3rem",
            marginBottom: "3rem",
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 900,
                  fontSize: "1.35rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--white)",
                }}
              >
                Fundability
                <span style={{ color: "var(--yellow)" }}>OS</span>
              </span>
            </Link>

            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                maxWidth: "24rem",
              }}
            >
              Know your fundability score before investors do. Built for founders
              across Southeast Asia.
            </p>

            <Link href="/interview" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
              Get Free Score
            </Link>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <span className="label-mono" style={{ color: "var(--yellow)", marginBottom: "0.25rem" }}>
                {category}
              </span>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                    letterSpacing: "0.03em",
                  }}
                  className="footer-link"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="yellow-bar-full" style={{ marginBottom: "1.5rem" }} />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <p className="label-metric" style={{ opacity: 0.4 }}>
            © {new Date().getFullYear()} FundabilityOS · A NextBlaze Venture
          </p>
          <p className="label-metric" style={{ opacity: 0.4 }}>
            Built for founders. Powered by AI.
          </p>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--yellow) !important; }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
