"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Search, 
  MoreVertical, 
  Edit2, 
  UserMinus, 
  Mail, 
  Building2, 
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  is_admin: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  }

  async function deleteUser(id: string) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    // In a real app, you'd use a service role or an admin API to delete from auth.users too.
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error) {
      setUsers(users.filter((u: Profile) => u.id !== id));
    }
  }

  const filteredUsers = users.filter((user: Profile) => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">User Intelligence</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">Manage and audit your {users.length} active founders.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#022f42]/10 text-[10px] font-black uppercase tracking-widest text-[#022f42] hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#ffd800] text-[#022f42] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#ffd800]/20">
             + Add Manual User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Total Users", value: users.length, icon: Users, color: "bg-blue-500" },
           { label: "Active Today", value: Math.floor(users.length * 0.4), icon: CheckCircle2, color: "bg-emerald-500" },
           { label: "Risk Flags", value: 3, icon: AlertCircle, color: "bg-red-500" },
           { label: "Growth", value: "+12%", icon: BarChart3, color: "bg-amber-500" },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 border border-[#022f42]/5 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-[#022f42]/20" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.label === "Growth" ? stat.value : ""}</span>
             </div>
             <div className="text-3xl font-black text-[#022f42]">{stat.label === "Growth" ? users.length : stat.value}</div>
             <div className="text-[10px] font-bold text-[#022f42]/40 uppercase tracking-widest mt-1">{stat.label}</div>
           </div>
         ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 border border-[#022f42]/5 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#022f42]/30" />
          <input 
            type="text" 
            placeholder="Search by name, email or company..."
            className="w-full bg-gray-50 border-none pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#ffd800] transition-all outline-none text-[#022f42]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-[10px] font-black uppercase tracking-widest text-[#022f42]/60 hover:bg-gray-200 transition-all flex-1 md:flex-none justify-center">
             <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#022f42]/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-[#022f42]/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">User Profile</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Company</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Joined</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#022f42]/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#022f42]/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#022f42] rounded-sm flex items-center justify-center text-[#ffd800] font-black text-sm">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#022f42]">{user.full_name || "Anonymous User"}</div>
                        <div className="text-[11px] font-medium text-[#022f42]/40 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-sm text-[#022f42]">
                    <div className="flex items-center gap-2">
                       <Building2 className="w-4 h-4 text-[#022f42]/20" />
                       {user.company_name || "---"}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {user.is_admin ? (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">System Admin</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">Founder</span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-[#022f42]/40">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-50" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white hover:shadow-md transition-all rounded-sm text-[#022f42]/40 hover:text-[#022f42]" title="Edit User">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="p-2 hover:bg-white hover:shadow-md transition-all rounded-sm text-[#022f42]/40 hover:text-red-600" title="Delete User"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white hover:shadow-md transition-all rounded-sm text-[#022f42]/40 hover:text-[#ffd800]" title="More Options">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredUsers.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-[#022f42]/10" />
              </div>
              <h3 className="text-xl font-black text-[#022f42] uppercase tracking-tighter">No Users Found</h3>
              <p className="text-sm font-medium text-[#022f42]/40 max-w-xs mx-auto mt-2">Try adjusting your search or filters to find what you are looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
