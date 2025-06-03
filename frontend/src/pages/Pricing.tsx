import React, { useState, useEffect } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { stripeService, SubscriptionPlan } from "../services/stripeService";

interface PricingProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansData = await stripeService.getPlans();
      setPlans(plansData);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError("Failed to load pricing plans. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
      return;
    }

    try {
      setCheckoutLoading(plan.id);
      const { url } = await stripeService.createCheckoutSession({
        priceId: plan.stripe_price_id,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const filteredPlans = plans.filter(
    (plan) => plan.interval === billingInterval
  );

  const getFeatureValue = (
    plan: SubscriptionPlan,
    feature: string
  ): string | boolean => {
    switch (feature) {
      case "locations":
        return plan.max_locations === -1 ? "Unlimited" : plan.max_locations;
      case "team_members":
        return plan.max_team_members === -1
          ? "Unlimited"
          : plan.max_team_members;
      case "trial_days":
        return plan.trial_period_days > 0
          ? `${plan.trial_period_days} days`
          : false;
      default:
        return plan.features.includes(feature);
    }
  };

  const renderFeatureValue = (value: string | boolean | number) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckIcon className="h-5 w-5 text-green-500" />
      ) : (
        <XMarkIcon className="h-5 w-5 text-gray-300" />
      );
    }
    return <span className="text-sm text-gray-900">{value}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Plans
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the perfect plan for your inventory management needs
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval("month")}
              className={`relative w-24 py-2 text-sm font-medium rounded-md focus:outline-none focus:z-10 ${
                billingInterval === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`relative w-24 py-2 text-sm font-medium rounded-md focus:outline-none focus:z-10 ${
                billingInterval === "year"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="mt-4 text-sm text-gray-500">
                    {plan.description}
                  </p>
                )}
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {stripeService.formatPrice(plan.price)}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /
                    {stripeService.formatInterval(
                      plan.interval,
                      plan.interval_count
                    )}
                  </span>
                </p>

                {plan.trial_period_days > 0 && (
                  <p className="mt-2 text-sm text-green-600 font-medium">
                    {plan.trial_period_days} day free trial
                  </p>
                )}

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={checkoutLoading === plan.id}
                  className="mt-8 block w-full bg-blue-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Get started"
                  )}
                </button>
              </div>

              <div className="pt-6 pb-8 px-6">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="flex space-x-3">
                    <span className="text-sm text-gray-500">Locations:</span>
                    {renderFeatureValue(getFeatureValue(plan, "locations"))}
                  </li>
                  <li className="flex space-x-3">
                    <span className="text-sm text-gray-500">Team members:</span>
                    {renderFeatureValue(getFeatureValue(plan, "team_members"))}
                  </li>

                  {/* Core Features */}
                  {[
                    "inventory_management",
                    "voice_commands",
                    "real_time_updates",
                    "bulk_import",
                    "analytics",
                    "api_access",
                    "priority_support",
                    "custom_integrations",
                  ].map((feature) => {
                    const hasFeature = plan.features.includes(feature);
                    if (!hasFeature) return null;

                    const featureNames: Record<string, string> = {
                      inventory_management: "Inventory Management",
                      voice_commands: "Voice Commands",
                      real_time_updates: "Real-time Updates",
                      bulk_import: "Bulk Import/Export",
                      analytics: "Advanced Analytics",
                      api_access: "API Access",
                      priority_support: "Priority Support",
                      custom_integrations: "Custom Integrations",
                    };

                    return (
                      <li key={feature} className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-500">
                          {featureNames[feature]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h3 className="text-2xl font-extrabold text-gray-900 text-center">
            Frequently asked questions
          </h3>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Can I change plans anytime?
              </h4>
              <p className="mt-2 text-base text-gray-500">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                will be prorated and reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                What payment methods do you accept?
              </h4>
              <p className="mt-2 text-base text-gray-500">
                We accept all major credit cards including Visa, Mastercard,
                American Express, and Discover.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Is there a free trial?
              </h4>
              <p className="mt-2 text-base text-gray-500">
                Yes, most plans include a free trial period. You can cancel
                anytime during your trial without being charged.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Can I cancel my subscription?
              </h4>
              <p className="mt-2 text-base text-gray-500">
                Yes, you can cancel your subscription at any time. You'll
                continue to have access until the end of your current billing
                period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
