"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Mail, 
  Building2, 
  Calendar, 
  User, 
  BarChart3, 
  FileText,
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Report {
  id: string;
  score: number;
  band: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  is_admin: boolean;
  role: string;
  created_at: string;
  reports: Report[];
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  async function fetchUser() {
    setLoading(true);
    try {
      // Use the admin API we created earlier (smart move: I should update that API to support single user fetch)
      // For now, I'll fetch all and filter, or I should create a new API route.
      // Let's create a specific API route for this to be clean.
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("[Admin User Detail Fetch Error]:", err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#ffd800] animate-spin mb-4" />
        <p className="text-sm font-bold text-[#022f42]/40 uppercase tracking-widest">Retrieving Founder Profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-[#022f42] uppercase tracking-tighter">User Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 text-[#ffd800] font-bold flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">
        <Link href="/admin/users" className="hover:text-[#ffd800] transition-colors">User Intelligence</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#022f42]">Founder Detail</span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white border border-[#022f42]/5 shadow-sm p-8 flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="w-20 h-20 bg-[#022f42] rounded-sm flex items-center justify-center text-[#ffd800] font-black text-3xl">
          {user.full_name?.charAt(0) || user.email?.charAt(0)}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-[#022f42] uppercase tracking-tighter">{user.full_name || "Anonymous User"}</h1>
            {user.is_admin ? (
              <span className="bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">System Admin</span>
            ) : (
              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">Verified Founder</span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm text-[#022f42]/60 font-medium">
              <Mail className="w-4 h-4 text-[#ffd800]" /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#022f42]/60 font-medium">
              <Building2 className="w-4 h-4 text-[#ffd800]" /> {user.company_name || "No Company Specified"}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#022f42]/60 font-medium">
              <Calendar className="w-4 h-4 text-[#ffd800]" /> Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/30 mb-1">Total Assessments</div>
            <div className="text-4xl font-black text-[#022f42]">{user.reports?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Assessment History */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-[#022f42] uppercase tracking-tighter flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#ffd800]" /> Assessment History
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {!user.reports || user.reports.length === 0 ? (
            <div className="bg-gray-50/50 border border-dashed border-[#022f42]/10 p-12 text-center rounded-sm">
              <p className="text-sm font-bold text-[#022f42]/30 uppercase tracking-widest">No diagnostic data found for this user.</p>
            </div>
          ) : (
            user.reports.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((report) => (
              <div key={report.id} className="bg-white border border-[#022f42]/5 shadow-sm p-6 hover:border-[#ffd800]/30 transition-all group flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#022f42]/30 mb-1">Score</div>
                    <div className="text-3xl font-black text-[#022f42]">{report.score}<span className="text-xs opacity-30">/100</span></div>
                  </div>
                  
                  <div className="h-10 w-px bg-gray-100" />

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">{report.band}</div>
                    <div className="text-sm font-bold text-[#022f42]">{new Date(report.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <Link 
                    href={`/report/${report.id}`}
                    target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#022f42] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#022f42]/90 transition-all"
                   >
                     View Full Report <ExternalLink className="w-3 h-3" />
                   </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
