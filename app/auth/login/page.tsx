"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();

  const getRedirectByRole = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "/dashboard";
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "investor") return "/investor/dashboard";
    return "/dashboard";
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");


  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const dest = await getRedirectByRole();
      router.push(dest);
      router.refresh();
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  if (magicLinkSent) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📬</div>
            <h1 className="heading-section" style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
              Check your email
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: 1.7 }}>
              We&apos;ve sent a magic link to <strong style={{ color: "var(--yellow)" }}>{email}</strong>.
              Click the link to sign in — no password needed.
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: "1.5rem" }}
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <span className="tag-badge" style={{ marginBottom: "1rem" }}>
            Welcome back
          </span>
          <h1 className="heading-section" style={{ fontSize: "1.75rem" }}>
            Sign in to <span style={{ color: "var(--yellow)" }}>FundabilityOS</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" style={{ color: "var(--yellow)", textDecoration: "none", fontWeight: 700 }}>
              Sign up free →
            </Link>
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "0", marginBottom: "1.75rem", border: "1px solid var(--yellow-20)", borderRadius: "2px", overflow: "hidden" }}>
          {(["password", "magic"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "0.625rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: mode === m ? "var(--yellow)" : "transparent",
                color: mode === m ? "var(--navy)" : "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {m === "password" ? "Password" : "Magic Link"}
            </button>
          ))}
        </div>

        {/* Error */}
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

        {/* Form */}
        <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@startup.com"
                required
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            {/* Password (only in password mode) */}
            {mode === "password" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={labelStyle}>Password</label>
                  <Link href="/auth/forgot-password" style={{ fontSize: "0.7rem", color: "var(--yellow)", textDecoration: "none", letterSpacing: "0.05em" }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    style={{ ...inputStyle, paddingRight: "2.75rem" }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.35)",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn btn-primary"
              style={{ justifyContent: "center", marginTop: "0.5rem" }}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : mode === "password" ? (
                <>Sign In <ArrowRight size={15} /></>
              ) : (
                <>Send Magic Link <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </form>

        <div className="yellow-bar-full" style={{ marginBlock: "1.5rem" }} />

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
          By signing in you agree to our{" "}
          <Link href="/privacy" style={{ color: "rgba(255,216,0,0.6)", textDecoration: "none" }}>Privacy Policy</Link>.
          Your data is encrypted and never shared.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: var(--yellow) !important; }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={pageStyle}><Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--yellow)" }} /></div>}>
      <LoginContent />
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
  width: "100%",
  maxWidth: "440px",
  backgroundColor: "rgba(255,255,255,0.03)",
  border: "1px solid var(--yellow-20)",
  borderRadius: "4px",
  padding: "2.5rem",
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
