import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  successUrl:
    process.env.STRIPE_SUCCESS_URL ||
    `${process.env.FRONTEND_URL}/subscription/success`,
  cancelUrl:
    process.env.STRIPE_CANCEL_URL || `${process.env.FRONTEND_URL}/pricing`,
} as const;
