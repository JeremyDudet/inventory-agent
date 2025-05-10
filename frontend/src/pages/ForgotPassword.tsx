// frontend/src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { AuthLayout } from "../components/ui/auth-layout";
import { Avatar } from "@/components/ui/avatar";
import { useThemeStore } from "@/stores/themeStore";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { resetPassword } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { theme } = useThemeStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
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
      const { error } = await resetPassword(email);

      if (error) {
        addNotification("error", error.message);
        return;
      }

      addNotification("success", "Password reset link sent to your email!");
    } catch (error) {
      addNotification("error", "Failed to send reset link. Please try again.");
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
        <div className="flex items-center gap-3">
          <Avatar
            src={
              theme === "dark"
                ? "/teams/logo-light.svg"
                : "/teams/logo-black.svg"
            }
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold text-zinc-950 dark:text-white">
            StockCount
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email and we'll send you a link to reset your password.
        </p>

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

        <button
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 w-full"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : "Reset password"}
        </button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-zinc-900 dark:text-zinc-50 underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
