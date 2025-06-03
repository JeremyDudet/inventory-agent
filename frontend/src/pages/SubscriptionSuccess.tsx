import React, { useEffect, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Link, useSearchParams } from "react-router-dom";
import { stripeService, UserSubscription } from "../services/stripeService";

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Fetch the user's subscription after successful payment
    const fetchSubscription = async () => {
      try {
        // Give Stripe webhooks a moment to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const sub = await stripeService.getCurrentSubscription();
        setSubscription(sub);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Processing your subscription...
          </h2>
          <p className="mt-2 text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Inventory Agent!
          </h1>

          <p className="text-gray-600 mb-6">
            Your subscription has been successfully activated. You now have
            access to all the features of your plan.
          </p>

          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {subscription.plan.name}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Price:</span>{" "}
                  {stripeService.formatPrice(subscription.plan.price)}/
                  {stripeService.formatInterval(subscription.plan.interval)}
                </p>
                <p>
                  <span className="font-medium">Locations:</span>{" "}
                  {subscription.plan.max_locations === -1
                    ? "Unlimited"
                    : subscription.plan.max_locations}
                </p>
                <p>
                  <span className="font-medium">Team Members:</span>{" "}
                  {subscription.plan.max_team_members === -1
                    ? "Unlimited"
                    : subscription.plan.max_team_members}
                </p>
                {stripeService.isSubscriptionInTrial(
                  subscription.subscription
                ) && (
                  <p className="text-blue-600 font-medium">
                    Trial ends in{" "}
                    {stripeService.getTrialDaysRemaining(
                      subscription.subscription
                    )}{" "}
                    days
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors inline-block"
            >
              Go to Dashboard
            </Link>

            <Link
              to="/subscription"
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors inline-block"
            >
              Manage Subscription
            </Link>
          </div>

          {sessionId && (
            <p className="mt-6 text-xs text-gray-500">
              Session ID: {sessionId}
            </p>
          )}
        </div>

        {/* Getting Started Tips */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Getting Started
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Set up your first location
                </p>
                <p>
                  Create and configure your inventory locations to get started.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Import your inventory
                </p>
                <p>
                  Upload your existing inventory data or start adding items
                  manually.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Try voice commands</p>
                <p>
                  Use voice commands to quickly update inventory levels
                  hands-free.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help getting started?{" "}
            <a href="/support" className="text-blue-600 hover:text-blue-500">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
