import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import supabase from "../config/supabase";

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setUser, setSession, setIsLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);

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
  }, [setUser, setSession, setIsLoading]);

  return <>{children}</>;
};
