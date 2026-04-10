"use client";

import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Users, BarChart3, Settings, ShieldCheck, Database, LogOut, ChevronRight, Zap } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#01161e]">
        <div className="w-10 h-10 border-4 border-[#ffd800]/10 border-t-[#ffd800] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Strict admin check
  if (!user || (!user.is_admin && user.id !== '00000000-0000-0000-0000-000000000000')) {
    redirect("/dashboard");
  }  const menuItems = [
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Pattern Vault", href: "/admin/vault", icon: Database },
    { name: "Performance Telemetry", href: "/admin/telemetry", icon: BarChart3 },
    { name: "Autonomous Calibration", href: "/admin/calibration", icon: ShieldCheck },
    { name: "Simulation Console", href: "/admin/simulate", icon: Zap },
    { name: "System Config", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#f2f6fa]">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-[#022f42] text-white flex flex-col sticky top-0 h-screen shadow-2xl z-50">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-[#ffd800]" />
            <h1 className="text-2xl font-black uppercase tracking-tighter">Command <span className="text-[#ffd800]">Center</span></h1>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Autonomous Intelligence OS</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 rounded-sm hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-white/40 group-hover:text-[#ffd800] transition-colors" />
                <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
           <Link href="/dashboard" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" /> Exit Admin Terminal
           </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-10 lg:p-16">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
