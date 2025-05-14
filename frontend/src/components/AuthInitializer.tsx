// frontend/src/components/AuthInitializer.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { api } from "@/services/api";
import { AuthUser } from "@/types";

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setUser, setSession, setIsLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);

        // Get the stored session from localStorage
        const storedSession = localStorage.getItem("auth-storage");
        if (!storedSession) {
          setIsLoading(false);
          return;
        }

        const { state } = JSON.parse(storedSession);
        if (!state.session?.access_token) {
          setIsLoading(false);
          return;
        }

        try {
          // Verify the session with our backend using the api service
          const response = await api.getUser(state.session.access_token);

          console.log("User data from /me endpoint:", response);

          // The response already contains the user object with permissions
          // based on your api.ts and the /me endpoint structure
          const userData: AuthUser = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            locations: response.user.locations || [],
          };

          // Update the user in the store
          setUser(userData);

          // Keep the existing session with the token
          setSession(state.session);

          console.log("User data set in store:", userData);
        } catch (error: any) {
          console.error("Error verifying session:", error);
          // If the session is invalid, clear it
          setSession(null);
          setUser(null);

          // If it's an auth error, redirect to login
          if (error.isAuthError || error.status === 401) {
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [setUser, setSession, setIsLoading, navigate]);

  return <>{children}</>;
};
