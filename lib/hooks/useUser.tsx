"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoaded: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // 1. Get initial user
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoaded(true);
    };

    getInitialUser();

    // 2. Listen for auth changes and sync cookies
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth Change Event]:", event);
      setUser(session?.user ?? null);
      setIsLoaded(true);

      // CRITICAL: When the session changes (Login/Logout), we MUST ensure 
      // the server-side cookies are updated. This tells the Middleware we are logged in.
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // This is a "No-Op" fetch that just triggers the middleware to see the new cookies
        // which Supabase's client sets automatically in the browser.
        await fetch("/api/auth/callback?sync=true");
        
        // If we have a hash (Implicit Flow), redirect to dashboard now that cookies are synced
        if (window.location.hash) {
          window.location.href = "/dashboard";
        }
      }

      if (event === "SIGNED_OUT") {
        window.location.href = "/";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoaded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
}
