"use client";

import { useEffect, useState } from "react";
import { BookMarked, Plus, Trash2, ToggleLeft, ToggleRight, X, Check } from "lucide-react";

interface Override {
  id: string;
  trigger_text: string;
  correction_rule: string;
  applied_count: number;
  is_active: boolean;
  created_at: string;
}

export default function OverridesPage() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [triggerText, setTriggerText] = useState("");
  const [correctionRule, setCorrectionRule] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOverrides();
  }, []);

  async function fetchOverrides() {
    setLoading(true);
    const res = await fetch("/api/admin/overrides");
    if (res.ok) setOverrides(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!triggerText.trim() || !correctionRule.trim()) return;
    setSaving(true);
    await fetch("/api/admin/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger_text: triggerText, correction_rule: correctionRule }),
    });
    setTriggerText("");
    setCorrectionRule("");
    setShowForm(false);
    setSaving(false);
    fetchOverrides();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this override rule?")) return;
    await fetch("/api/admin/overrides", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchOverrides();
  }

  async function handleToggle(id: string) {
    await fetch("/api/admin/overrides", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });
    fetchOverrides();
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-[#022f42] uppercase tracking-tighter">Semantic Overrides</h2>
          <p className="text-sm font-medium text-[#022f42]/50 mt-1">
            Expert correction rules. When a trigger keyword appears in a founder's answers, the correction is injected into the AI prompt.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-8 py-3 bg-[#022f42] text-[#ffd800] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors shadow-lg"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Override"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-[#ffd800] shadow-xl p-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#022f42]">New Expert Override Rule</h3>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Trigger Keyword / Phrase</label>
            <input
              type="text"
              value={triggerText}
              onChange={e => setTriggerText(e.target.value)}
              placeholder="e.g. pre-revenue, solo founder, no traction..."
              required
              className="w-full border border-[#022f42]/10 p-4 text-sm font-medium text-[#022f42] outline-none focus:border-[#ffd800] transition-colors"
            />
            <p className="text-[10px] text-[#022f42]/30">Case-insensitive. If this phrase appears in a founder's answers, the correction below will be injected into the AI prompt.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">Correction Instruction</label>
            <textarea
              value={correctionRule}
              onChange={e => setCorrectionRule(e.target.value)}
              rows={5}
              placeholder="e.g. When a founder is pre-revenue, cap the Revenue Model score at 8/20 unless they provide a validated LOI or pilot contract. Do not credit projected revenue as traction."
              required
              className="w-full border border-[#022f42]/10 p-4 text-sm font-medium text-[#022f42] outline-none focus:border-[#ffd800] transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-[#022f42] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd800] hover:text-[#022f42] transition-colors"
          >
            {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save Override Rule</>}
          </button>
        </form>
      )}

      {/* Overrides Table */}
      <div className="bg-white border border-[#022f42]/5 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#022f42]/5 flex items-center gap-3">
          <BookMarked className="w-4 h-4 text-[#022f42]/30" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#022f42]/40">
            {overrides.length} Active Rules
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-[#ffd800] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : overrides.length === 0 ? (
          <div className="p-16 text-center">
            <BookMarked className="w-12 h-12 text-[#022f42]/10 mx-auto mb-4" />
            <p className="text-sm text-[#022f42]/30 italic">No override rules yet. Add your first expert correction above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f2f6fa]">
              <tr>
                {["Trigger", "Correction Rule", "Applied", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[#022f42]/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#022f42]/5">
              {overrides.map(override => (
                <tr key={override.id} className={`hover:bg-[#f2f6fa]/50 transition-colors ${!override.is_active ? "opacity-40" : ""}`}>
                  <td className="px-5 py-4">
                    <code className="text-[11px] font-black text-[#022f42] bg-[#022f42]/5 px-2 py-0.5 rounded">
                      {override.trigger_text}
                    </code>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-xs text-[#022f42]/70 leading-relaxed line-clamp-2">{override.correction_rule}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-black text-[#022f42]">{override.applied_count}</span>
                    <span className="text-[9px] text-[#022f42]/30 ml-1">times</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${override.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {override.is_active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(override.id)}
                      className="p-1.5 hover:bg-[#022f42]/5 rounded transition-colors"
                      title={override.is_active ? "Pause rule" : "Activate rule"}
                    >
                      {override.is_active
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-[#022f42]/30" />}
                    </button>
                    <button
                      onClick={() => handleDelete(override.id)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors text-[#022f42]/30 hover:text-red-500"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
