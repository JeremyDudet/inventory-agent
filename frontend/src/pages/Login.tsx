// frontend/src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { AuthLayout } from "../components/ui/auth-layout";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { theme, isInitialized } = useThemeStore();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Save email to localStorage if rememberMe is checked
  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }
  }, [rememberMe, email]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await login(email, password);

      if (error) {
        addNotification("error", error.message);
        return;
      }

      addNotification("success", "Login successful!");
    } catch (error) {
      addNotification("error", "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-sm grid-cols-1 gap-8"
      >
        <Link
          to="/"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <div className="flex items-center gap-3">
            {isInitialized && (
              <Avatar
                src={
                  theme === "dark"
                    ? "/teams/logo-light.svg"
                    : "/teams/logo-black.svg"
                }
                className="w-8 h-8"
              />
            )}
            <span className="text-lg font-semibold text-zinc-950 dark:text-white">
              StockCount
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to your account
        </h1>

        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
              errors.email ? "border-red-500" : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <span className="text-red-500 text-xs mt-1">{errors.email}</span>
          )}
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
              errors.password ? "border-red-500" : ""
            }`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <span className="text-red-500 text-xs mt-1">{errors.password}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <CheckboxField>
            <Checkbox
              checked={rememberMe}
              onChange={(checked) => setRememberMe(checked)}
              id="remember"
              color="dark/zinc"
            />
            <label
              htmlFor="remember"
              data-slot="label"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              onClick={() => setRememberMe(!rememberMe)}
            >
              Remember me
            </label>
          </CheckboxField>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 w-full"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : "Login"}
        </button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-zinc-900 dark:text-zinc-50 underline"
          >
            Join the waitlist
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
