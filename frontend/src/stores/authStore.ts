// frontend/src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session, AuthError } from "@supabase/supabase-js";
import { api } from "../services/api";
import { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    error: AuthError | null;
    data: { user: AuthUser | null; session: Session | null };
  }>;
  register: (
    email: string,
    password: string,
    name: string,
    inviteCode?: string,
    locationName?: string
  ) => Promise<{
    data: { user: AuthUser | null; session: Session | null };
    error: AuthError | { message: string } | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    data: {} | null;
    error: AuthError | null;
  }>;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null as AuthUser | null,
      session: null as Session | null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setIsLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        try {
          const response = await api.login({
            email,
            password,
          });

          // Transform the response.user to match UserProfile interface
          const user: AuthUser = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            locations: response.user.locations || [],
          };

          // Create a session object
          const session: Session = {
            access_token: response.token,
            refresh_token: "",
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: response.user.id,
              email: response.user.email,
              // Add other required Supabase user properties
              aud: "authenticated",
              created_at: new Date().toISOString(),
            },
          } as Session;

          set({ user: user, session });
          return { error: null, data: { user: user, session } };
        } catch (error: any) {
          const authError = new Error(
            error.message || "Login failed"
          ) as AuthError;
          authError.status = error.status || 500;
          authError.name = "AuthError";
          return {
            error: authError,
            data: { user: null, session: null },
          };
        }
      },

      register: async (
        email: string,
        password: string,
        name: string,
        inviteCode?: string,
        locationName?: string
      ) => {
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              name,
              inviteCode,
              locationName,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              error: { message: data.error?.message || "Registration failed" },
              data: { user: null, session: null },
            };
          }

          // Transform the response to match UserProfile interface
          const user: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            locations: data.user.locations || [],
          };

          // Create a session object
          const session: Session = {
            access_token: data.token,
            refresh_token: "",
            expires_in: 3600,
            token_type: "bearer",
            user: {
              id: data.user.id,
              email: data.user.email,
              aud: "authenticated",
              created_at: new Date().toISOString(),
            },
          } as Session;

          set({ user: user, session });
          return { error: null, data: { user: user, session } };
        } catch (error: any) {
          return {
            error: { message: error.message || "Registration failed" },
            data: { user: null, session: null },
          };
        }
      },

      signOut: async () => {
        try {
          // Note: You'll need to add a logout endpoint to your API service
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${get().session?.access_token}`,
            },
          });
        } catch (error) {
          console.error("Error during logout:", error);
        } finally {
          // WebSocket service will automatically disconnect when user becomes null
          // due to the subscription in the WebSocketService constructor
          set({ user: null, session: null });
        }
      },

      resetPassword: async (email: string) => {
        try {
          // Note: You'll need to add a reset-password endpoint to your API service
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            const error = new Error(
              data.error?.message || "Password reset failed"
            ) as AuthError;
            error.status = response.status;
            error.name = "AuthError";
            error.code = data.error?.code || "AUTH_ERROR";
            return {
              error,
              data: null,
            };
          }

          return { error: null, data: {} };
        } catch (error: any) {
          const authError = new Error(
            error.message || "Password reset failed"
          ) as AuthError;
          authError.status = 500;
          authError.name = "AuthError";
          authError.code = "AUTH_ERROR";
          return {
            error: authError,
            data: null,
          };
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
