import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "../stores/notificationStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { AuthLayout } from "../components/ui/auth-layout";
import { Avatar } from "@/components/ui/avatar";
import { useThemeStore } from "@/stores/themeStore";
import { api, ApiError } from "@/services/api";

const WaitingList: React.FC = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [inventoryMethod, setInventoryMethod] = useState("");
  const [softwareName, setSoftwareName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { theme } = useThemeStore();
  const { addNotification } = useNotificationStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!name) {
      newErrors.name = "Name is required";
    }

    if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
      newErrors.phone = "Phone number is invalid";
    }

    if (!businessType) {
      newErrors.businessType = "Business type is required";
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
      // Prepare form data
      const formData = {
        email,
        name,
        phone,
        businessType,
        inventoryMethod,
        softwareName: inventoryMethod === "software" ? softwareName : undefined,
      };

      // Call the API to submit waiting list data
      await api.addUserToWaitingList(formData);

      addNotification(
        "success",
        "Thank you for joining our waiting list! We'll be in touch soon."
      );
      alert("Thank you for joining our waiting list! We'll be in touch soon.");

      // Reset form
      setEmail("");
      setName("");
      setPhone("");
      setBusinessType("");
      setInventoryMethod("");
      setSoftwareName("");
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Error) {
        const apiError = error as ApiError;
        if (apiError.status === 409) {
          alert(
            "This email is already registered. Please use a different email address."
          );
          addNotification(
            "error",
            "This email is already registered. Please use a different email address."
          );
        } else if (apiError.status === 400) {
          alert(apiError.message || "Please check your input and try again.");
          addNotification(
            "error",
            apiError.message || "Please check your input and try again."
          );
        } else {
          alert("Failed to join waiting list. Please try again later.");
          addNotification(
            "error",
            "Failed to join waiting list. Please try again later."
          );
        }
      } else {
        alert("An unexpected error occurred. Please try again later.");
        addNotification(
          "error",
          "An unexpected error occurred. Please try again later."
        );
      }
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
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Join the Waiting List
        </h1>

        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Email *
          </label>
          <input
            id="email"
            type="email"
            className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
              errors.email ? "border-red-500" : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          {errors.email && (
            <span className="text-red-500 text-xs mt-1">{errors.email}</span>
          )}
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="name"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
              errors.name ? "border-red-500" : ""
            }`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <span className="text-red-500 text-xs mt-1">{errors.name}</span>
          )}
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            type="tel"
            className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
              errors.phone ? "border-red-500" : ""
            }`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
          {errors.phone && (
            <span className="text-red-500 text-xs mt-1">{errors.phone}</span>
          )}
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="businessType"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Business Type *
          </label>
          <select
            id="businessType"
            className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
              errors.businessType ? "border-red-500" : ""
            }`}
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            <option value="">Select your business type</option>
            <option value="solopreneur">Solopreneur</option>
            <option value="small-business">
              Small Business (1-10 employees)
            </option>
            <option value="medium-business">
              Medium Business (11-50 employees)
            </option>
            <option value="large-business">
              Large Business (51+ employees)
            </option>
            <option value="other">Other</option>
          </select>
          {errors.businessType && (
            <span className="text-red-500 text-xs mt-1">
              {errors.businessType}
            </span>
          )}
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="inventoryMethod"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Current Inventory Management Method (Optional)
          </label>
          <select
            id="inventoryMethod"
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
            value={inventoryMethod}
            onChange={(e) => setInventoryMethod(e.target.value)}
          >
            <option value="">Select an option</option>
            <option value="manual">Manual (pen and paper)</option>
            <option value="spreadsheets">Spreadsheets</option>
            <option value="software">Other software / service</option>
            <option value="none">None</option>
          </select>
        </div>

        {inventoryMethod === "software" && (
          <div className="grid gap-2">
            <label
              htmlFor="softwareName"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Software Name
            </label>
            <input
              id="softwareName"
              type="text"
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
              value={softwareName}
              onChange={(e) => setSoftwareName(e.target.value)}
              placeholder="Enter the name of the software / service"
            />
          </div>
        )}

        <button
          type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 w-full"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : "Join Waiting List"}
        </button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-zinc-900 dark:text-zinc-50 underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default WaitingList;
