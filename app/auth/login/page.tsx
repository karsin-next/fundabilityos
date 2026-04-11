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
  const urlError = searchParams.get("error");
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
  const [error, setError] = useState(urlError || "");
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

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?redirect=${redirectTo}` 
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.error) {
        setError(data.error);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setError("Failed to trigger magic link. Please try again.");
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "linkedin") {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Pass the redirect destination so callback knows where to send the user
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) setError(error.message);
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

        {/* Social Auth */}
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--yellow-20)" }} />
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--yellow-20)" }} />
          </div>

          <button
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
            Continue with Google
          </button>
        </div>

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
