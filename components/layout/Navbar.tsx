"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { Menu, X, LayoutDashboard, Home, Rocket, Info, Briefcase, LogOut } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded, signOut } = useUser();

  // Hide Navbar only on deep interview/checkout flows and admin pages
  const hideNavRoutes = ["/interview", "/upload", "/checkout", "/admin"];
  const shouldHide = hideNavRoutes.some((route) => pathname?.startsWith(route));
  if (shouldHide) return null;

  return (
    <header className="sticky top-0 z-50 bg-[#022f42] py-3 px-6 md:px-8 border-b-[3px] border-[#ffd800] w-full">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
          <Image
            src="/logo.png"
            alt="NextBlaze Logo"
            width={200}
            height={56}
            className="h-10 md:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            priority
          />
          <div className="flex flex-col border-l border-white/20 pl-3">
            <span className="text-white font-black text-lg md:text-xl tracking-tight leading-none uppercase">NextBlaze</span>
            <span className="text-[#ffd800] text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">SaaS Solutions</span>
          </div>
        </Link>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#ffd800] p-2 focus:outline-none hover:bg-white/5 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>

        {/* Nav links */}
        <nav className={`
          ${menuOpen ? "flex" : "hidden"}
          md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto
          bg-[#022f42] md:bg-transparent border-t-2 border-[#ffd800] md:border-none
          py-10 md:py-0 md:pl-8 items-center gap-8 md:gap-10 transition-all shadow-2xl md:shadow-none
        `}>
          <Link href="/" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
            <Home size={14} className="md:hidden" /> Home
          </Link>
          <Link href="/#impact" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
            <Rocket size={14} className="md:hidden" /> Impact
          </Link>
          <Link href="/#cases" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
            <Briefcase size={14} className="md:hidden" /> Case Studies
          </Link>

          <Link href="/methodology" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
            <Info size={14} className="md:hidden" /> Methodology
          </Link>

          <div className="flex items-center gap-6 ml-0 md:ml-4 flex-col md:flex-row mt-6 md:mt-0 w-full md:w-auto px-6 md:px-0">
            {isLoaded && user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary w-full md:w-auto shadow-[0_10px_20px_-5px_rgba(255,216,0,0.3)]"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button
                  onClick={() => { signOut(); router.push("/"); }}
                  className="text-white/60 hover:text-[#ffd800] p-2 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </>
            )}
            {isLoaded && !user && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary w-full md:w-auto"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
