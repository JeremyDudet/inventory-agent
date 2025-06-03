import React, { useState, useEffect } from "react";
import {
  CreditCardIcon,
  CalendarIcon,
  UserGroupIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { stripeService, UserSubscription } from "../services/stripeService";

interface SubscriptionManagementProps {
  className?: string;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  className = "",
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const sub = await stripeService.getCurrentSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period."
    );

    if (!confirmed) return;

    try {
      setActionLoading("cancel");
      await stripeService.cancelSubscription(false);
      await fetchSubscription(); // Refresh subscription data
    } catch (err) {
      console.error("Error canceling subscription:", err);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    try {
      setActionLoading("reactivate");
      await stripeService.reactivateSubscription();
      await fetchSubscription(); // Refresh subscription data
    } catch (err) {
      console.error("Error reactivating subscription:", err);
      alert("Failed to reactivate subscription. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription) return;

    try {
      setActionLoading("portal");
      const { url } = await stripeService.createPortalSession(
        window.location.href
      );
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error opening billing portal:", err);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchSubscription}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 mb-4">
            You don't have an active subscription.
          </p>
          <a
            href="/pricing"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
          >
            View Plans
          </a>
        </div>
      </div>
    );
  }

  const isActive = stripeService.isSubscriptionActive(
    subscription.subscription
  );
  const isInTrial = stripeService.isSubscriptionInTrial(
    subscription.subscription
  );
  const trialDaysRemaining = stripeService.getTrialDaysRemaining(
    subscription.subscription
  );
  const statusColor = stripeService.getSubscriptionStatusColor(
    subscription.subscription
  );
  const statusText = stripeService.getSubscriptionStatusText(
    subscription.subscription
  );

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Current Subscription
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Plan Details */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {subscription.plan.name}
          </h4>
          {subscription.plan.description && (
            <p className="text-gray-600 mb-4">
              {subscription.plan.description}
            </p>
          )}

          <div className="flex items-center text-2xl font-bold text-gray-900">
            {stripeService.formatPrice(subscription.plan.price)}
            <span className="text-sm font-normal text-gray-500 ml-1">
              /
              {stripeService.formatInterval(
                subscription.plan.interval,
                subscription.plan.interval_count
              )}
            </span>
          </div>

          {isInTrial && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Trial Active:</span>{" "}
                {trialDaysRemaining} days remaining
              </p>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <MapPinIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Locations</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.plan.max_locations === -1
                  ? "Unlimited"
                  : subscription.plan.max_locations}
              </p>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Team Members</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.plan.max_team_members === -1
                  ? "Unlimited"
                  : subscription.plan.max_team_members}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Current Period</span>
            <span className="text-sm text-gray-900">
              {formatDate(subscription.subscription.current_period_start)} -{" "}
              {formatDate(subscription.subscription.current_period_end)}
            </span>
          </div>

          {subscription.subscription.trial_end && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Trial Ends</span>
              <span className="text-sm text-gray-900">
                {formatDate(subscription.subscription.trial_end)}
              </span>
            </div>
          )}

          {subscription.subscription.cancel_at_period_end && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Subscription Ending:</span> Your
                subscription will end on{" "}
                {formatDate(subscription.subscription.current_period_end)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleManageBilling}
            disabled={actionLoading === "portal"}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <CreditCardIcon className="h-4 w-4 mr-2" />
            {actionLoading === "portal" ? "Opening..." : "Manage Billing"}
          </button>

          {isActive && !subscription.subscription.cancel_at_period_end && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading === "cancel"}
              className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {actionLoading === "cancel"
                ? "Canceling..."
                : "Cancel Subscription"}
            </button>
          )}

          {subscription.subscription.cancel_at_period_end && (
            <button
              onClick={handleReactivateSubscription}
              disabled={actionLoading === "reactivate"}
              className="w-full flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {actionLoading === "reactivate"
                ? "Reactivating..."
                : "Reactivate Subscription"}
            </button>
          )}
        </div>

        {/* Features List */}
        {subscription.plan.features.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-3">
              Included Features
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subscription.plan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {feature.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
