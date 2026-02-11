import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle token expiration/invalid
        if (event === "TOKEN_REFRESHED" && !session) {
          // Token refresh failed — session expired
          localStorage.removeItem("forjus_stay_connected");
          sessionStorage.removeItem("forjus_session_active");
        }
      }
    );

    // Check current session and handle "stay connected" logic
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const stayConnected = localStorage.getItem("forjus_stay_connected") === "true";
        const sessionActive = sessionStorage.getItem("forjus_session_active") === "true";

        if (!stayConnected && !sessionActive) {
          // Browser was closed and user didn't want to stay connected — sign out
          supabase.auth.signOut().then(() => {
            setSession(null);
            setUser(null);
            setLoading(false);
          });
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear session markers but preserve email if "remember" is set
    sessionStorage.removeItem("forjus_session_active");
    localStorage.removeItem("forjus_stay_connected");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
