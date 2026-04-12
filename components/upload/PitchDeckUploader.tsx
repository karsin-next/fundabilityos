"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Upload, FileText, X, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import LeadCaptureGate from "@/components/auth/LeadCaptureGate";

type UploadState = "idle" | "uploading" | "extracting" | "done" | "error";

interface ExtractedData {
  company_name?: string;
  problem?: string;
  solution?: string;
  market_size?: string;
  revenue_model?: string;
  monthly_revenue?: string;
  team?: string;
  funding_ask?: string;
  missing_fields?: string[];
  raw_summary?: string;
}

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ["application/pdf"];

export default function PitchDeckUploader({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Only PDF files are accepted.";
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_FILE_SIZE_MB}MB.`;
    return null;
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }

  function selectFile(f: File) {
    const err = validateFile(f);
    if (err) { setErrorMsg(err); return; }
    setFile(f);
    setErrorMsg("");
  }

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploadState("uploading");
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 12, 70));
      }, 500);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(80);

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${uploadRes.status})`);
      }

      const result = await uploadRes.json();
      setProgress(100);

      // New API returns extracted_data directly — no polling needed
      // Store extraction context for the AI Interview to skip redundant questions
      if (result.extracted_data) {
        localStorage.setItem("PITCH_DECK_CONTEXT", JSON.stringify(result.extracted_data));
        setExtracted(result.extracted_data);
        setUploadState("done");
        return;
      }

      // Legacy polling fallback (should not be needed with new API)
      setUploadState("extracting");
      const sessionId = result.sessionId;
      let attempts = 0;
      while (attempts < 30) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
        const checkRes = await fetch(`/api/upload/status?sessionId=${sessionId}`);
        if (!checkRes.ok) continue;
        const status = await checkRes.json();
        setProgress(Math.min(80 + attempts * 2, 98));
        if (status.status === "done" && status.extracted_data) {
          setExtracted(status.extracted_data);
          setProgress(100);
          setUploadState("done");
          return;
        }
        if (status.status === "error") throw new Error(status.error || "Extraction failed");
      }

      throw new Error("Extraction timed out. Please try the interview instead.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  }, [file]);

  // ============================================================
  // DONE — show extracted data + start interview CTA
  // ============================================================
  if (uploadState === "done" && extracted) {
    const FIELD_LABELS: Record<string, string> = {
      company_name: "Company Name",
      problem: "Problem Statement",
      solution: "Solution",
      market_size: "Market Size",
      revenue_model: "Revenue Model",
      monthly_revenue: "Monthly Revenue",
      team: "Team",
      funding_ask: "Funding Ask",
    };

    return (
      <div style={{ paddingTop: "68px", backgroundColor: "var(--navy)", minHeight: "100vh", padding: "68px 1.25rem 3rem" }}>
        <div style={{ maxWidth: "720px", marginInline: "auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <span className="tag-badge" style={{ marginBottom: "1rem" }}>Pitch Deck Analyzed</span>
            <h1 className="heading-section" style={{ marginBottom: "0.75rem" }}>
              We found <span style={{ color: "var(--yellow)" }}>your data.</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
              Review what we extracted. We&apos;ll use this to pre-fill your interview — saving you time.
            </p>
          </div>

          {/* Extracted fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }} className="extracted-grid">
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const value = extracted[key as keyof ExtractedData];
              const isMissing = !value || extracted.missing_fields?.includes(key);
              return (
                <div key={key} style={{ padding: "1.125rem", border: `1px solid ${isMissing ? "rgba(239,68,68,0.2)" : "var(--yellow-20)"}`, borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isMissing ? "var(--red)" : "var(--yellow)", marginBottom: "0.375rem" }}>
                    {isMissing ? "⚠ Missing — " : ""}{label}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: isMissing ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                    {value?.toString() || "Not found in deck"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Missing fields warning */}
          {extracted.missing_fields && extracted.missing_fields.length > 0 && (
            <div style={{ padding: "1rem 1.25rem", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "4px", backgroundColor: "rgba(245,158,11,0.06)", marginBottom: "2rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--amber)", fontWeight: 700, marginBottom: "0.375rem" }}>
                ⚠ {extracted.missing_fields.length} field{extracted.missing_fields.length > 1 ? "s" : ""} missing from your deck
              </p>
              <p style={{ fontSize: "0.775rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                Our AI will ask you about these in the interview to complete your score.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/interview?source=deck" className="btn btn-primary btn-lg">
              Continue to AI Interview <ArrowRight size={16} />
            </Link>
            <button onClick={() => { setFile(null); setExtracted(null); setUploadState("idle"); setProgress(0); }} className="btn btn-ghost">
              Upload Different Deck
            </button>
          </div>
        </div>
        <style>{`@media(max-width:640px){.extracted-grid{grid-template-columns:1fr!important;}}`}</style>
      </div>
    );
  }

  // ============================================================
  // UPLOADING / EXTRACTING PROGRESS
  // ============================================================
  if (uploadState === "uploading" || uploadState === "extracting") {
    return (
      <div style={{ paddingTop: "68px", minHeight: "100vh", backgroundColor: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <Loader2 size={40} style={{ color: "var(--yellow)", animation: "spin 1s linear infinite", marginBottom: "1.5rem" }} />
          <h2 className="heading-section" style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>
            {uploadState === "uploading" ? "Uploading your deck…" : "Extracting with AI…"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            {uploadState === "uploading"
              ? "Securely transferring your file."
              : "Claude is reading your pitch deck and extracting key data. Usually takes 20–40 seconds."}
          </p>
          {/* Progress bar */}
          <div style={{ backgroundColor: "var(--yellow-10)", borderRadius: "100px", height: "6px", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--yellow)", borderRadius: "100px", transition: "width 0.5s ease" }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", marginTop: "0.625rem" }}>{progress}%</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================================
  // MAIN UPLOAD UI
  // ============================================================
  return (
    <div style={isEmbedded ? { width: "100%", backgroundColor: "var(--navy)", borderRadius: "8px", border: "1px solid rgba(255,216,0,0.15)", padding: "2rem" } : { paddingTop: "68px", backgroundColor: "var(--navy)", minHeight: "100vh" }}>
      <div style={isEmbedded ? {} : { padding: "clamp(3rem, 6vw, 5rem) 1.25rem" }}>
        <LeadCaptureGate>
          <div style={{ maxWidth: "640px", marginInline: "auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <span className="tag-badge" style={{ marginBottom: "1rem" }}>Alternative to the Interview</span>
            <h1 className="heading-section" style={{ marginBottom: "0.875rem" }}>
              Upload your <span style={{ color: "var(--yellow)" }}>pitch deck.</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.75 }}>
              Our AI reads your PDF and extracts the key data investors look for — then scores you automatically. No typing needed.
            </p>
          </div>

          {/* Drop zone */}
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer", marginBottom: "1.5rem" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
            />

            {file ? (
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem" }}
                onClick={(e) => e.stopPropagation()}
              >
                <CheckCircle size={36} style={{ color: "var(--yellow)" }} />
                <div>
                  <p style={{ fontWeight: 700, color: "var(--white)", fontSize: "0.9rem" }}>{file.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.775rem", marginTop: "0.25rem" }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setErrorMsg(""); }}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem" }}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--yellow-10)", border: "1px solid var(--yellow-20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={24} style={{ color: "var(--yellow)" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 700, color: "var(--white)", fontSize: "0.9rem" }}>
                    Drop your pitch deck here
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.775rem", marginTop: "0.25rem" }}>
                    or click to browse · PDF only · Max 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", padding: "0.875rem 1rem", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", backgroundColor: "rgba(239,68,68,0.07)", marginBottom: "1.25rem" }}>
              <AlertCircle size={16} style={{ color: "var(--red)", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "0.825rem", color: "#FCA5A5", lineHeight: 1.6 }}>{errorMsg}</p>
            </div>
          )}

          {/* Upload button */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploadState !== "idle"}
              className="btn btn-primary btn-lg"
              style={{ opacity: !file ? 0.5 : 1 }}
            >
              <FileText size={16} />
              Analyze My Deck
            </button>
            <Link href="/interview" className="btn btn-ghost">
              Use Chat Interview Instead
            </Link>
          </div>

          {/* Security note */}
          <div style={{ marginTop: "2.5rem", padding: "1.125rem 1.25rem", border: "1px solid var(--yellow-20)", borderRadius: "4px", backgroundColor: "rgba(255,216,0,0.03)" }}>
            <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "0.5rem", fontSize: "0.6rem" }}>
              🔒 Privacy & Security
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              Your pitch deck is encrypted in transit (TLS 1.3) and stored in an isolated bucket with access controls. Files are automatically deleted after 90 days. We never share your deck with third parties.
            </p>
          </div>

          {/* What we extract */}
          <div style={{ marginTop: "2rem" }}>
            <p className="label-mono" style={{ color: "var(--yellow)", marginBottom: "1rem", fontSize: "0.6rem" }}>What We Extract Automatically</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {["Problem & solution", "Market size estimate", "Revenue & traction", "Team composition", "Funding ask", "Business model", "Competitive landscape", "Key milestones"].map((item) => (
                <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>
                  <CheckCircle size={12} style={{ color: "var(--yellow)", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        </LeadCaptureGate>
      </div>
    </div>
  );
}
