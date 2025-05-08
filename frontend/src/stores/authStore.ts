import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Session,
  SupabaseClient,
  User,
  AuthError,
} from "@supabase/supabase-js";
import supabase from "../config/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient;
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
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      supabase,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setIsLoading: (isLoading) => set({ isLoading }),

      signIn: async (email: string, password: string) => {
        return await supabase.auth.signInWithPassword({ email, password });
      },

      signUp: async (
        email: string,
        password: string,
        name: string,
        inviteCode?: string
      ) => {
        try {
          let role = "readonly";

          if (inviteCode) {
            const response = await fetch(
              `/api/auth/verify-invite/${inviteCode}`
            );
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

          const result = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                role,
                inviteCode,
              },
            },
          });

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
              console.error(
                "Error informing backend about registration:",
                error
              );
            }
          }

          return result;
        } catch (error: any) {
          return {
            error: { message: error.message },
            data: { user: null, session: null },
          };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      resetPassword: async (email: string) => {
        return await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
