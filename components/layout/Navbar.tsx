"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

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
          className="md:hidden text-[#ffd800] text-3xl focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Nav links */}
        <nav className={`
          ${menuOpen ? "flex" : "hidden"}
          md:flex flex-col md:flex-row absolute md:relative top-full left-0 w-full md:w-auto
          bg-[#022f42] md:bg-transparent border-t-2 border-[#ffd800] md:border-none
          py-8 md:py-0 md:pl-8 items-center gap-6 md:gap-8 transition-all shadow-lg md:shadow-none
        `}>
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-white/90 hover:text-[#ffd800] font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#ffd800] transition-all pb-1">
            Home
          </Link>
          <Link href="/#impact" onClick={() => setMenuOpen(false)} className="text-white/90 hover:text-[#ffd800] font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#ffd800] transition-all pb-1">
            Impact
          </Link>
          <Link href="/#cases" onClick={() => setMenuOpen(false)} className="text-white/90 hover:text-[#ffd800] font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#ffd800] transition-all pb-1">
            Case Studies
          </Link>

          <Link href="/methodology" onClick={() => setMenuOpen(false)} className="text-white/90 hover:text-[#ffd800] font-bold text-sm uppercase tracking-widest border-b-2 border-transparent hover:border-[#ffd800] transition-all pb-1">
            Methodology
          </Link>

          <div className="flex items-center gap-4 ml-0 md:ml-4 flex-col md:flex-row mt-4 md:mt-0">
            {isLoaded && user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="bg-[#ffd800] border-2 border-[#ffd800] text-[#022f42] hover:bg-transparent hover:text-[#ffd800] px-6 py-2 font-bold text-sm uppercase tracking-widest transition-all text-center shadow-md"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
            {/* HIDDEN FOR NOW
            {isLoaded && !user && (
               <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="bg-[#ffd800] border-2 border-[#ffd800] text-[#022f42] hover:bg-transparent hover:text-[#ffd800] px-6 py-2 font-bold text-sm uppercase tracking-widest transition-all text-center shadow-md"
              >
                Login
              </Link>
            )}
            */}
          </div>
        </nav>
      </div>
    </header>
  );
}
