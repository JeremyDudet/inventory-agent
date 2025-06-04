import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import { stripe } from "../src/config/stripe";

async function listStripePrices() {
  try {
    console.log("Fetching Stripe prices and products...\n");

    // Get all active prices
    const prices = await stripe.prices.list({
      limit: 20,
      active: true,
      expand: ["data.product"],
    });

    if (prices.data.length === 0) {
      console.log("❌ No active prices found in your Stripe account.");
      console.log(
        "Please create products and prices in your Stripe dashboard first."
      );
      process.exit(1);
    }

    console.log("📋 Your Stripe Prices:\n");

    prices.data.forEach((price, index) => {
      const product = price.product as any;
      console.log(`${index + 1}. ${product.name || "Unnamed Product"}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(
        `   Amount: $${
          (price.unit_amount || 0) / 100
        } ${price.currency.toUpperCase()}`
      );
      console.log(`   Interval: ${price.recurring?.interval || "one-time"}`);
      console.log(`   Description: ${product.description || "No description"}`);
      console.log("   ---");
    });

    console.log(
      "\n💡 Copy these IDs to replace the placeholders in add-subscription-plans.ts"
    );
    console.log("   Then run: npm run add-plans");
  } catch (error) {
    console.error("❌ Error fetching Stripe data:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
    process.exit(1);
  }
}

listStripePrices();
