"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PERKS = [
  "Fundability Score (0–100) — free",
  "Top 3 investor concern gaps",
  "AI-powered 30-day action plan",
  "Access to 50+ SEA investors (with badge)",
];

function SignupContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          referral_code_used: referralCode || undefined,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.session) {
      // If email confirmation is disabled, we get a session immediately
      window.location.href = "/dashboard";
    } else {
      setSuccess(true);
    }
  }

  async function handleSocialLogin(provider: "google" | "linkedin") {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Simplified to exact match for Supabase Dashboard allowlist
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎉</div>
            <h1 className="heading-section" style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
              You&apos;re almost in
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: 1.7 }}>
              We&apos;ve sent a confirmation email to{" "}
              <strong style={{ color: "var(--yellow)" }}>{email}</strong>.
              Click the link to activate your account, then start your free assessment.
            </p>
            <Link href="/interview" className="btn btn-primary" style={{ marginTop: "1.75rem", display: "inline-flex" }}>
              Start Free Assessment While You Wait
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", width: "100%", maxWidth: "900px", alignItems: "start" }} className="signup-grid">
        {/* Left: Value prop */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="signup-left">
          <div>
            <span className="tag-badge" style={{ marginBottom: "1rem" }}>Free to start</span>
            <h1 className="heading-section" style={{ fontSize: "2rem" }}>
              Know your score before
              <br />
              <span style={{ color: "var(--yellow)" }}>investors do.</span>
            </h1>
          </div>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: 1.75 }}>
            Join 2,400+ Southeast Asian founders who use FundabilityOS to
            identify investor concerns before they walk into the room.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {PERKS.map((perk) => (
              <div key={perk} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <CheckCircle size={16} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>{perk}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "0.5rem",
              padding: "1.25rem",
              border: "1px solid var(--yellow-20)",
              borderRadius: "4px",
              backgroundColor: "rgba(255,216,0,0.04)",
            }}
          >
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontStyle: "italic" }}>
              &ldquo;I used FundabilityOS before my Series A pitch and went in knowing my weakest dimension was runway.
              Fixed it with a bridge note. Closed the round in 6 weeks.&rdquo;
            </p>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--yellow)", marginTop: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              — SEA Founder, Raised $1.2M
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div style={cardStyle}>
          <div style={{ marginBottom: "1.75rem" }}>
            <h2 className="heading-card" style={{ fontSize: "1rem", marginBottom: "0.375rem" }}>
              Create your free account
            </h2>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              Already have one?{" "}
              <Link href="/auth/login" style={{ color: "var(--yellow)", textDecoration: "none", fontWeight: 700 }}>
                Sign in →
              </Link>
            </p>
          </div>

          {referralCode && (
            <div style={{
              backgroundColor: "rgba(255,216,0,0.08)",
              border: "1px solid var(--yellow-20)",
              borderRadius: "2px",
              padding: "0.625rem 0.875rem",
              marginBottom: "1.25rem",
              fontSize: "0.75rem",
              color: "var(--yellow)",
            }}>
              🎁 Referral: <strong>{referralCode}</strong> — $5 credit applied after your first purchase
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "2px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.8rem",
              color: "#FCA5A5",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input id="signup-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Karsin Tan" required style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Company / startup name</label>
                <input id="signup-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="My Startup Sdn Bhd" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Email address</label>
                <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="founder@startup.com" required style={inputStyle} autoComplete="email" />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    style={{ ...inputStyle, paddingRight: "2.75rem" }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: "0.35rem", display: "flex", gap: "3px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ height: "2px", flex: 1, borderRadius: "1px", backgroundColor: password.length >= i * 3 ? (password.length >= 12 ? "var(--green)" : password.length >= 8 ? "var(--amber)" : "var(--red)") : "var(--yellow-20)" }} />
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading || !email || !fullName} className="btn btn-primary" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <>Create Free Account <ArrowRight size={15} /></>}
              </button>

              {/* Social Auth */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--yellow-20)" }} />
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--yellow-20)" }} />
                </div>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  className="btn btn-ghost"
                  style={{ 
                    width: "100%", 
                    justifyContent: "center", 
                    gap: "0.75rem", 
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--yellow-20)",
                    fontSize: "0.75rem"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign up with Google
                </button>
              </div>
            </div>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.6, marginTop: "1.25rem" }}>
            By signing up you agree to our{" "}
            <Link href="/privacy" style={{ color: "rgba(255,216,0,0.5)", textDecoration: "none" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: var(--yellow) !important; }
        @media (max-width: 768px) {
          .signup-grid { grid-template-columns: 1fr !important; }
          .signup-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={pageStyle}><Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--yellow)" }} /></div>}>
      <SignupContent />
    </Suspense>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5rem 1.25rem 3rem",
  backgroundColor: "var(--navy)",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid var(--yellow-20)",
  borderRadius: "4px",
  padding: "2rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.5)",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid var(--yellow-20)",
  borderRadius: "2px",
  padding: "0.75rem 1rem",
  fontSize: "0.9rem",
  color: "var(--white)",
  fontFamily: "var(--font-sans)",
  transition: "border-color 0.2s ease",
};
