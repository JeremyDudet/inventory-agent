import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Session,
  SupabaseClient,
  User,
  AuthError,
} from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: AuthError | null;
    data: { user: User | null; session: Session | null };
  }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    inviteCode?: string
  ) => Promise<{
    data: { user: User | null; session: Session | null };
    error: AuthError | { message: any } | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    data: {} | null;
    error: AuthError | null;
  }>;
  supabase: SupabaseClient;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current session and user on mount
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    inviteCode?: string
  ) => {
    try {
      // If invite code is provided, verify it
      let role = "readonly"; // Default to readonly without invite code

      if (inviteCode) {
        // Verify invite code with backend
        const response = await fetch(`/api/auth/verify-invite/${inviteCode}`);
        if (!response.ok) {
          throw new Error("Invalid or expired invite code");
        }

        const data = await response.json();
        if (data.valid && data.role) {
          role = data.role;
        } else {
          throw new Error("Invalid invite code data");
        }
      }

      // Register with Supabase
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            inviteCode, // Store invite code for backend processing
          },
        },
      });

      // If registration was successful and invite code was provided, inform backend
      if (!result.error && result.data.user && inviteCode) {
        try {
          await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              name,
              inviteCode,
            }),
          });
        } catch (error) {
          console.error("Error informing backend about registration:", error);
        }
      }

      return result;
    } catch (error: any) {
      return {
        error: { message: error.message },
        data: { user: null, session: null },
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
