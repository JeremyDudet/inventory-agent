import express, { Request, Response } from "express";
import { StripeService } from "../services/stripeService";
import { stripe } from "../config/stripe";
import db from "../db";
import { authenticate } from "../middleware/auth";
import { subscription_plans } from "../db/schema";
import { eq } from "drizzle-orm";
import { AuthUser } from "../types";
import Stripe from "stripe";

const router = express.Router();

// Get all subscription plans
router.get("/plans", async (req: Request, res: Response) => {
  try {
    const plans = await StripeService.getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

// Create checkout session
router.post("/checkout", authenticate, async (req: Request, res: Response) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const user = req.user as AuthUser;
    const userId = user.id;
    const userEmail = user.email;
    const userName = user.name;

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    if (!userId || !userEmail) {
      return res.status(400).json({ error: "User information is required" });
    }

    const session = await StripeService.createCheckoutSession({
      userId,
      priceId,
      email: userEmail,
      name: userName,
      successUrl,
      cancelUrl,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Get user's current subscription
router.get("/current", authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    const userId = user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const subscription = await StripeService.getUserActiveSubscription(userId);
    res.json(subscription);
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    res.status(500).json({ error: "Failed to fetch current subscription" });
  }
});

// Cancel subscription
router.post("/cancel", authenticate, async (req: Request, res: Response) => {
  try {
    const { immediately = false } = req.body;
    const user = req.user as AuthUser;
    const userId = user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userSubscription = await StripeService.getUserActiveSubscription(
      userId
    );

    if (!userSubscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    const canceledSubscription = await StripeService.cancelSubscription(
      userSubscription.subscription.stripe_subscription_id,
      immediately
    );

    // Sync the updated subscription
    await StripeService.syncSubscriptionFromStripe(canceledSubscription.id);

    res.json({
      message: "Subscription canceled successfully",
      subscription: canceledSubscription,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Reactivate subscription
router.post(
  "/reactivate",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthUser;
      const userId = user.id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const userSubscription = await StripeService.getUserActiveSubscription(
        userId
      );

      if (!userSubscription) {
        return res.status(404).json({ error: "No subscription found" });
      }

      const reactivatedSubscription =
        await StripeService.reactivateSubscription(
          userSubscription.subscription.stripe_subscription_id
        );

      // Sync the updated subscription
      await StripeService.syncSubscriptionFromStripe(
        reactivatedSubscription.id
      );

      res.json({
        message: "Subscription reactivated successfully",
        subscription: reactivatedSubscription,
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  }
);

// Create customer portal session
router.post("/portal", authenticate, async (req: Request, res: Response) => {
  try {
    const { returnUrl } = req.body;
    const user = req.user as AuthUser;
    const userId = user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userSubscription = await StripeService.getUserActiveSubscription(
      userId
    );

    if (!userSubscription) {
      return res.status(404).json({ error: "No subscription found" });
    }

    const portalSession = await StripeService.getCustomerPortalSession(
      userSubscription.customer.stripe_customer_id,
      returnUrl || `${process.env.FRONTEND_URL}/dashboard`
    );

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Webhook endpoint for Stripe events
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return res.status(400).send("Webhook secret not configured");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          const subscription = event.data.object;
          await StripeService.syncSubscriptionFromStripe(subscription.id);
          console.log(`Subscription ${event.type}:`, subscription.id);
          break;

        case "invoice.payment_succeeded":
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId =
            typeof invoice.lines.data[0]?.subscription === "string"
              ? invoice.lines.data[0].subscription
              : invoice.lines.data[0]?.subscription?.id;

          if (subscriptionId) {
            await StripeService.syncSubscriptionFromStripe(subscriptionId);
            console.log(
              "Invoice payment succeeded for subscription:",
              subscriptionId
            );
          }
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object as Stripe.Invoice;
          const failedSubscriptionId =
            typeof failedInvoice.lines.data[0]?.subscription === "string"
              ? failedInvoice.lines.data[0].subscription
              : failedInvoice.lines.data[0]?.subscription?.id;

          if (failedSubscriptionId) {
            await StripeService.syncSubscriptionFromStripe(
              failedSubscriptionId
            );
            console.log(
              "Invoice payment failed for subscription:",
              failedSubscriptionId
            );
          }
          break;

        case "customer.subscription.trial_will_end":
          const trialEndingSubscription = event.data.object;
          console.log(
            "Trial ending for subscription:",
            trialEndingSubscription.id
          );
          // You can add email notification logic here
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Admin routes (add proper admin authorization middleware)
router.post(
  "/admin/plans",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // TODO: Add admin authorization check
      const {
        stripe_price_id,
        stripe_product_id,
        name,
        description,
        price,
        currency = "usd",
        interval,
        interval_count = 1,
        trial_period_days = 0,
        max_locations = 1,
        max_team_members = 1,
        features = [],
      } = req.body;

      const newPlan = await db
        .insert(subscription_plans)
        .values({
          stripe_price_id,
          stripe_product_id,
          name,
          description,
          price,
          currency,
          interval,
          interval_count,
          trial_period_days,
          max_locations,
          max_team_members,
          features,
        })
        .returning();

      res.status(201).json(newPlan[0]);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  }
);

router.put(
  "/admin/plans/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // TODO: Add admin authorization check
      const { id } = req.params;
      const updateData = req.body;

      const updatedPlan = await db
        .update(subscription_plans)
        .set({ ...updateData, updated_at: new Date().toISOString() })
        .where(eq(subscription_plans.id, id))
        .returning();

      if (updatedPlan.length === 0) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }

      res.json(updatedPlan[0]);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  }
);

export default router;
