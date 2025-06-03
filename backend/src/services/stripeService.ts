import Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "../config/stripe";
import db from "../db";
import { customers, subscriptions, subscription_plans } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface CreateSubscriptionParams {
  userId: string;
  priceId: string;
  email: string;
  name?: string;
}

export interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  email: string;
  name?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export class StripeService {
  static async createOrGetCustomer(
    userId: string,
    email: string,
    name?: string
  ): Promise<string> {
    try {
      // Check if customer already exists in our database
      const existingCustomer = await db
        .select()
        .from(customers)
        .where(eq(customers.user_id, userId))
        .limit(1);

      if (existingCustomer.length > 0) {
        return existingCustomer[0].stripe_customer_id;
      }

      // Create new Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      // Save customer to our database
      await db.insert(customers).values({
        user_id: userId,
        stripe_customer_id: stripeCustomer.id,
        email,
        name,
      });

      return stripeCustomer.id;
    } catch (error) {
      console.error("Error creating/getting customer:", error);
      throw new Error("Failed to create or get customer");
    }
  }

  static async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<Stripe.Checkout.Session> {
    try {
      const customerId = await this.createOrGetCustomer(
        params.userId,
        params.email,
        params.name
      );

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: params.successUrl || STRIPE_CONFIG.successUrl,
        cancel_url: params.cancelUrl || STRIPE_CONFIG.cancelUrl,
        metadata: {
          userId: params.userId,
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
      });

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new Error("Failed to create checkout session");
    }
  }

  static async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<Stripe.Subscription> {
    try {
      const customerId = await this.createOrGetCustomer(
        params.userId,
        params.email,
        params.name
      );

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: params.priceId,
          },
        ],
        metadata: {
          userId: params.userId,
        },
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      return subscription;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw new Error("Failed to create subscription");
    }
  }

  static async cancelSubscription(
    subscriptionId: string,
    immediately = false
  ): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  static async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw new Error("Failed to reactivate subscription");
    }
  }

  static async updatePaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<Stripe.Subscription> {
    try {
      // Attach payment method to customer
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: subscription.customer as string,
      });

      // Update customer's default payment method
      await stripe.customers.update(subscription.customer as string, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update subscription's default payment method
      return await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw new Error("Failed to update payment method");
    }
  }

  static async getCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
    } catch (error) {
      console.error("Error creating portal session:", error);
      throw new Error("Failed to create portal session");
    }
  }

  static async syncSubscriptionFromStripe(
    stripeSubscriptionId: string
  ): Promise<void> {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        stripeSubscriptionId,
        {
          expand: ["items.data.price.product"],
        }
      );

      // Find the customer in our database
      const customer = await db
        .select()
        .from(customers)
        .where(
          eq(
            customers.stripe_customer_id,
            stripeSubscription.customer as string
          )
        )
        .limit(1);

      if (customer.length === 0) {
        throw new Error("Customer not found in database");
      }

      // Find the subscription plan
      const priceId = stripeSubscription.items.data[0]?.price?.id;
      if (!priceId) {
        throw new Error("Price ID not found in subscription");
      }

      const plan = await db
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.stripe_price_id, priceId))
        .limit(1);

      if (plan.length === 0) {
        throw new Error("Subscription plan not found in database");
      }

      // Update or create subscription in our database
      const subscriptionData = {
        customer_id: customer[0].id,
        plan_id: plan[0].id,
        stripe_subscription_id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: new Date(
          (stripeSubscription as any).current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          (stripeSubscription as any).current_period_end * 1000
        ).toISOString(),
        trial_end: (stripeSubscription as any).trial_end
          ? new Date((stripeSubscription as any).trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        canceled_at: (stripeSubscription as any).canceled_at
          ? new Date(
              (stripeSubscription as any).canceled_at * 1000
            ).toISOString()
          : null,
        ended_at: (stripeSubscription as any).ended_at
          ? new Date((stripeSubscription as any).ended_at * 1000).toISOString()
          : null,
      };

      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripe_subscription_id, stripeSubscription.id))
        .limit(1);

      if (existingSubscription.length > 0) {
        await db
          .update(subscriptions)
          .set({
            ...subscriptionData,
            updated_at: new Date().toISOString(),
          })
          .where(eq(subscriptions.id, existingSubscription[0].id));
      } else {
        await db.insert(subscriptions).values(subscriptionData);
      }
    } catch (error) {
      console.error("Error syncing subscription:", error);
      throw new Error("Failed to sync subscription");
    }
  }

  static async getUserActiveSubscription(userId: string) {
    try {
      const result = await db
        .select({
          subscription: subscriptions,
          plan: subscription_plans,
          customer: customers,
        })
        .from(subscriptions)
        .innerJoin(customers, eq(subscriptions.customer_id, customers.id))
        .innerJoin(
          subscription_plans,
          eq(subscriptions.plan_id, subscription_plans.id)
        )
        .where(
          and(eq(customers.user_id, userId), eq(subscriptions.status, "active"))
        )
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting user active subscription:", error);
      throw new Error("Failed to get user active subscription");
    }
  }

  static async getAllPlans() {
    try {
      return await db
        .select()
        .from(subscription_plans)
        .where(eq(subscription_plans.is_active, true))
        .orderBy(subscription_plans.price);
    } catch (error) {
      console.error("Error getting all plans:", error);
      throw new Error("Failed to get all plans");
    }
  }
}
