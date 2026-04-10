"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f2f6fa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#022f42]/10 border-t-[#ffd800] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#022f42]">Loading your Dashboard...</p>
        </div>
      </div>
    );
  }

  // Protected route check
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f2f6fa]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Dashboard Header Bar */}
        <header className="h-20 bg-white border-b border-[#022f42]/5 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             {/* Breadcrumbs or search could go here */}
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/upload" 
              className="bg-[#ffd800] text-[#022f42] font-black text-[11px] uppercase tracking-widest px-8 py-3.5 shadow-[0_10px_20px_-5px_rgba(255,216,0,0.5)] hover:scale-[1.02] transition-all flex items-center gap-3 w-[300px] justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
              Upload Pitch Deck
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
