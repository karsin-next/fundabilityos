"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/directory", label: "Investors" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: scrolled
          ? "rgba(2, 47, 66, 0.97)"
          : "rgba(2, 47, 66, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid rgba(255,216,0,0.12)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "68px",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 900,
              fontSize: "1.15rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--white)",
            }}
          >
            Fundability
            <span style={{ color: "var(--yellow)" }}>OS</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2.25rem",
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${
                pathname === link.href ? "nav-link-active" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/interview" className="btn btn-primary btn-sm desktop-cta">
            Get Fundability Score
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            style={{
              background: "none",
              border: "none",
              color: "var(--white)",
              cursor: "pointer",
              padding: "0.25rem",
              display: "none",
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile flyout */}
      {menuOpen && (
        <div
          style={{
            backgroundColor: "var(--navy)",
            borderTop: "1px solid var(--yellow-20)",
            padding: "1.5rem var(--container-px)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: "0.85rem" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/interview"
            className="btn btn-primary"
            onClick={() => setMenuOpen(false)}
            style={{ alignSelf: "flex-start" }}
          >
            Get Fundability Score
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
