import { sql } from "drizzle-orm";
import { subscriptionPlans } from "../schema";

export async function up(db: any) {
  await db.insert(subscriptionPlans).values([
    {
      stripePriceId: "price_basic_monthly", // Replace with your Stripe price ID
      stripeProductId: "prod_basic", // Replace with your Stripe product ID
      name: "Basic Plan",
      description: "Perfect for small businesses",
      price: 9.99,
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      trialPeriodDays: 14,
      maxLocations: 1,
      maxTeamMembers: 3,
      features: [
        "1 Location",
        "3 Team Members",
        "Basic Inventory Management",
        "Email Support",
      ],
      isActive: true,
    },
    {
      stripePriceId: "price_basic_yearly", // Replace with your Stripe price ID
      stripeProductId: "prod_basic", // Replace with your Stripe product ID
      name: "Basic Plan",
      description: "Perfect for small businesses",
      price: 99.99,
      currency: "usd",
      interval: "year",
      intervalCount: 1,
      trialPeriodDays: 14,
      maxLocations: 1,
      maxTeamMembers: 3,
      features: [
        "1 Location",
        "3 Team Members",
        "Basic Inventory Management",
        "Email Support",
        "Save 20% with yearly billing",
      ],
      isActive: true,
    },
    {
      stripePriceId: "price_pro_monthly", // Replace with your Stripe price ID
      stripeProductId: "prod_pro", // Replace with your Stripe product ID
      name: "Pro Plan",
      description: "Ideal for growing businesses",
      price: 29.99,
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      trialPeriodDays: 14,
      maxLocations: 5,
      maxTeamMembers: 10,
      features: [
        "5 Locations",
        "10 Team Members",
        "Advanced Inventory Management",
        "Priority Support",
        "Analytics & Reporting",
        "Custom Branding",
      ],
      isActive: true,
    },
    {
      stripePriceId: "price_pro_yearly", // Replace with your Stripe price ID
      stripeProductId: "prod_pro", // Replace with your Stripe product ID
      name: "Pro Plan",
      description: "Ideal for growing businesses",
      price: 299.99,
      currency: "usd",
      interval: "year",
      intervalCount: 1,
      trialPeriodDays: 14,
      maxLocations: 5,
      maxTeamMembers: 10,
      features: [
        "5 Locations",
        "10 Team Members",
        "Advanced Inventory Management",
        "Priority Support",
        "Analytics & Reporting",
        "Custom Branding",
        "Save 20% with yearly billing",
      ],
      isActive: true,
    },
  ]);
}

export async function down(db: any) {
  await db
    .delete(subscriptionPlans)
    .where(
      sql`stripe_price_id IN ('price_basic_monthly', 'price_basic_yearly', 'price_pro_monthly', 'price_pro_yearly')`
    );
}
