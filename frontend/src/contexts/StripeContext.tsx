import React, { createContext, useContext, useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error("useStripe must be used within a StripeProvider");
  }
  return context;
};

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
          throw new Error(
            "Stripe publishable key not found in environment variables"
          );
        }

        const stripeInstance = await loadStripe(publishableKey);
        setStripe(stripeInstance);
      } catch (err) {
        console.error("Failed to initialize Stripe:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize Stripe"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);

  const value = {
    stripe,
    isLoading,
    error,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Payment System Error
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Payment System Unavailable
          </h2>
          <p className="text-gray-600">
            Unable to load payment system. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripe}>{children}</Elements>
    </StripeContext.Provider>
  );
};
