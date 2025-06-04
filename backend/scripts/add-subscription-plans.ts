import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import db from "../src/db";
import { subscription_plans } from "../src/db/schema";

async function addSubscriptionPlans() {
  try {
    console.log("Adding subscription plans...");

    const plans = [
      {
        stripe_price_id: "price_1RW5vlLuosOsVuBjy6HGaz0B", // Replace with your actual Stripe Price ID
        stripe_product_id: "prod_SQxryZzSmQrq3j", // Replace with your actual Stripe Product ID
        name: "Starter - Monthly",
        description: "For home-based chefs and solo operators.",
        price: 20.0,
        currency: "usd",
        interval: "month" as const,
        interval_count: 1,
        trial_period_days: 14,
        max_locations: 1,
        max_team_members: 3,
        features: [
          "Voice-controlled stock counting",
          "Invoice processing",
          "Cost per Menu Item",
          "Auto Generated Shopping lists",
          "Activity logging",
          "Invite 3 team members",
        ],
        is_active: true,
      },
      {
        stripe_price_id: "price_1RW5xJLuosOsVuBjGfW7E4LV", // Replace with your actual Stripe Price ID
        stripe_product_id: "prod_SQxtlxWiuN9Cov", // Replace with your actual Stripe Product ID
        name: "Small Business - Monthly",
        description: "Ideal for small cafes and restaurants.",
        price: 35.0,
        currency: "usd",
        interval: "month" as const,
        interval_count: 1,
        trial_period_days: 14,
        max_locations: 1,
        max_team_members: 10,
        features: [
          "Voice-controlled stock counting",
          "Invoice processing",
          "COGS tracking",
          "Cost per Menu Item",
          "Auto Generated Shopping lists",
          "Activity logging",
          "Invite 10 team members",
        ],
        is_active: true,
      },
      {
        stripe_price_id: "price_1RW5yxLuosOsVuBjtVBmujYW", // Replace with your actual Stripe Price ID
        stripe_product_id: "prod_SQxu4ZlRRb62ek", // Replace with your actual Stripe Product ID
        name: "Medium Business - Monthly",
        description:
          "For when you're scaling your business to multiple locations.",
        price: 67.0,
        currency: "usd",
        interval: "month" as const,
        interval_count: 1,
        trial_period_days: 14,
        max_locations: 3,
        max_team_members: 20,
        features: [
          "Voice-controlled stock counting",
          "Invoice processing",
          "COGS tracking",
          "Cost per Menu Item",
          "Auto Generated Shopping lists",
          "Activity logging",
          "Invite 20 team members",
        ],
        is_active: true,
      },
    ];

    for (const plan of plans) {
      const result = await db
        .insert(subscription_plans)
        .values(plan)
        .returning();

      console.log(
        `✅ Added plan: ${plan.name} (${plan.interval}) - ID: ${result[0].id}`
      );
    }

    console.log("✅ All subscription plans added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding subscription plans:", error);
    process.exit(1);
  }
}

addSubscriptionPlans();
