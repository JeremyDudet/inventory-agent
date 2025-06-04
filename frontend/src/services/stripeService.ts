import { api } from "./api";

export interface SubscriptionPlan {
  id: string;
  stripe_price_id: string;
  stripe_product_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  interval_count: number;
  trial_period_days: number;
  max_locations: number;
  max_team_members: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status:
    | "active"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "paused"
    | "trialing"
    | "unpaid";
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  subscription: Subscription;
  plan: SubscriptionPlan;
  customer: Customer;
}

export interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface CustomerPortalResponse {
  url: string;
}

class StripeService {
  // Get all available subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get("/api/subscriptions/plans");
    return response.data;
  }

  // Create a checkout session
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResponse> {
    const response = await api.post("/subscriptions/checkout", params);
    return response.data;
  }

  // Get current user's subscription
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await api.get("/subscriptions/current");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No subscription found
      }
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(
    immediately = false
  ): Promise<{ message: string; subscription: any }> {
    const response = await api.post("/subscriptions/cancel", { immediately });
    return response.data;
  }

  // Reactivate subscription
  async reactivateSubscription(): Promise<{
    message: string;
    subscription: any;
  }> {
    const response = await api.post("/subscriptions/reactivate");
    return response.data;
  }

  // Create customer portal session
  async createPortalSession(
    returnUrl?: string
  ): Promise<CustomerPortalResponse> {
    const response = await api.post("/subscriptions/portal", { returnUrl });
    return response.data;
  }

  // Admin: Create subscription plan
  async createPlan(
    plan: Omit<SubscriptionPlan, "id" | "created_at" | "updated_at">
  ): Promise<SubscriptionPlan> {
    const response = await api.post("/subscriptions/admin/plans", plan);
    return response.data;
  }

  // Admin: Update subscription plan
  async updatePlan(
    id: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    const response = await api.put(`/subscriptions/admin/plans/${id}`, updates);
    return response.data;
  }

  // Helper: Format price for display
  formatPrice(price: number, currency: string = "usd"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(price);
  }

  // Helper: Format interval for display
  formatInterval(interval: string, intervalCount: number = 1): string {
    if (intervalCount === 1) {
      return interval === "month" ? "monthly" : "yearly";
    }
    return interval === "month"
      ? `every ${intervalCount} months`
      : `every ${intervalCount} years`;
  }

  // Helper: Check if subscription is active
  isSubscriptionActive(subscription: Subscription): boolean {
    return (
      subscription.status === "active" || subscription.status === "trialing"
    );
  }

  // Helper: Check if subscription is in trial
  isSubscriptionInTrial(subscription: Subscription): boolean {
    if (!subscription.trial_end) return false;
    return new Date(subscription.trial_end) > new Date();
  }

  // Helper: Get days remaining in trial
  getTrialDaysRemaining(subscription: Subscription): number {
    if (!subscription.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Helper: Get subscription status display text
  getSubscriptionStatusText(subscription: Subscription): string {
    switch (subscription.status) {
      case "active":
        return "Active";
      case "trialing":
        return "Trial";
      case "canceled":
        return subscription.cancel_at_period_end ? "Canceling" : "Canceled";
      case "past_due":
        return "Past Due";
      case "incomplete":
        return "Incomplete";
      case "incomplete_expired":
        return "Expired";
      case "paused":
        return "Paused";
      case "unpaid":
        return "Unpaid";
      default:
        return "Unknown";
    }
  }

  // Helper: Get subscription status color
  getSubscriptionStatusColor(subscription: Subscription): string {
    switch (subscription.status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "trialing":
        return "text-blue-600 bg-blue-100";
      case "canceled":
        return "text-red-600 bg-red-100";
      case "past_due":
        return "text-yellow-600 bg-yellow-100";
      case "incomplete":
      case "incomplete_expired":
        return "text-orange-600 bg-orange-100";
      case "paused":
        return "text-gray-600 bg-gray-100";
      case "unpaid":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  }
}

export const stripeService = new StripeService();
