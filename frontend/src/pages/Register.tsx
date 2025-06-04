// frontend/src/pages/Register.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { AuthLayout } from "../components/ui/auth-layout";
import { Avatar } from "@/components/ui/avatar";
import { useThemeStore } from "@/stores/themeStore";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { stripeService, SubscriptionPlan } from "@/services/stripeService";

type RegistrationStep = 'type' | 'account' | 'plan' | 'location';

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('type');
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [country, setCountry] = useState("United States");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [registrationType, setRegistrationType] = useState<"invite" | "create">("create");
  const [inviteCode, setInviteCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const { theme, isInitialized } = useThemeStore();
  const navigate = useNavigate();

  const { register } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (currentStep === 'plan') {
      fetchPlans();
    }
  }, [currentStep]);

  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      console.log('Fetching plans...');
      const plansData = await stripeService.getPlans();
      console.log('Received plans:', plansData);
      if (Array.isArray(plansData)) {
        setPlans(plansData);
        // Set default plan to the first monthly plan
        const defaultPlan = plansData.find((plan) => plan.interval === "month");
        if (defaultPlan) {
          setSelectedPlan(defaultPlan);
        }
      } else {
        console.error('Plans data is not an array:', plansData);
        setPlans([]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      addNotification("error", "Failed to load subscription plans");
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const validateStep = (step: RegistrationStep) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'type':
        // No validation needed for type selection
        break;
      case 'account':
        if (!email) {
          newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
          newErrors.email = "Email is invalid";
        }

        if (!fullName) {
          newErrors.fullName = "Full name is required";
        }

        if (!password) {
          newErrors.password = "Password is required";
        } else if (password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        }

        if (!confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
        break;
      case 'plan':
        if (registrationType === "create" && !selectedPlan) {
          newErrors.plan = "Please select a subscription plan";
        }
        break;
      case 'location':
        if (registrationType === "create") {
          if (!locationName) {
            newErrors.locationName = "Location name is required";
          }
          if (!streetAddress) {
            newErrors.streetAddress = "Street address is required";
          }
          if (!city) {
            newErrors.city = "City is required";
          }
          if (!state) {
            newErrors.state = "State is required";
          }
          if (!zipCode) {
            newErrors.zipCode = "ZIP code is required";
          }
        }
        if (registrationType === "invite" && !inviteCode) {
          newErrors.inviteCode = "Invite code is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      switch (currentStep) {
        case 'type':
          setCurrentStep('account');
          break;
        case 'account':
          if (registrationType === 'create') {
            setCurrentStep('plan');
          } else {
            setCurrentStep('location');
          }
          break;
        case 'plan':
          setCurrentStep('location');
          break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep('location')) {
      return;
    }

    setIsLoading(true);

    try {
      const { error: registerError } = await register(
        email,
        password,
        fullName,
        registrationType === "invite" ? inviteCode : undefined,
        registrationType === "create" ? locationName : undefined,
        registrationType === "create" ? selectedPlan?.stripe_price_id : undefined
      );

      if (registerError) {
        addNotification("error", registerError.message);
        return;
      }
    } catch (error) {
      addNotification("error", "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlans =
    plans?.filter((plan) => plan.interval === billingInterval) || [];

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return (
          <div className="grid gap-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                Choose how to get started
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Select how you'd like to join StockCount
              </p>
            </div>

            <div className="grid gap-6">
              <div
                className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                  registrationType === "create"
                    ? "border-zinc-900 bg-zinc-50 dark:bg-zinc-800"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                onClick={() => setRegistrationType("create")}
              >
                <h3 className="font-medium text-lg mb-2">Create New Location</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Set up your own location and start managing inventory with our paid plans
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Full access to all features
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Choose from flexible subscription plans
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Start with a free trial
                  </li>
                </ul>
              </div>

              <div
                className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                  registrationType === "invite"
                    ? "border-zinc-900 bg-zinc-50 dark:bg-zinc-800"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                onClick={() => setRegistrationType("invite")}
              >
                <h3 className="font-medium text-lg mb-2">Join with Invite Code</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Join an existing location using an invite code from your team
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Free access to your team's location
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Collaborate with your team
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    No payment required
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 w-full"
            >
              Continue
            </button>
          </div>
        );

      case 'account':
        return (
          <div className="grid gap-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                Create your account
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Enter your account details to continue
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <span className="text-red-500 text-xs mt-1">{errors.email}</span>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="fullName" className="text-sm font-medium leading-none">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                    errors.fullName ? "border-red-500" : ""
                  }`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                {errors.fullName && (
                  <span className="text-red-500 text-xs mt-1">{errors.fullName}</span>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <input
                  id="password"
                  type={showPasswords ? "text" : "password"}
                  className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && (
                  <span className="text-red-500 text-xs mt-1">{errors.password}</span>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <span className="text-red-500 text-xs mt-1">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <CheckboxField>
                  <Checkbox
                    id="showPasswords"
                    checked={showPasswords}
                    onChange={(checked) => setShowPasswords(checked)}
                  />
                  <label htmlFor="showPasswords" className="text-sm font-medium leading-none">
                    Show passwords
                  </label>
                </CheckboxField>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep('type')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 h-10 px-4 py-2 flex-1"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 flex-1"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'plan':
        return (
          <div className="grid gap-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                Choose your plan
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Select a subscription plan that works for you
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">
                  Billing Interval
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("month")}
                    className={`px-3 py-1 text-sm rounded-md ${
                      billingInterval === "month"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval("year")}
                    className={`px-3 py-1 text-sm rounded-md ${
                      billingInterval === "year"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    Yearly
                    <span className="ml-1 text-xs text-green-600">Save 20%</span>
                  </button>
                </div>
              </div>

              {isLoadingPlans ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">
                  No subscription plans available at the moment.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id
                          ? "border-zinc-900 bg-zinc-50 dark:bg-zinc-800"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{plan.name}</h3>
                          <p className="text-sm text-zinc-500">{plan.description}</p>
                          {plan.features && plan.features.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="text-sm text-zinc-600 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {stripeService.formatPrice(plan.price)}
                            <span className="text-sm text-zinc-500">/{plan.interval}</span>
                          </div>
                          {plan.trial_period_days > 0 && (
                            <div className="text-sm text-green-600">
                              {plan.trial_period_days} day free trial
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.plan && (
                <span className="text-red-500 text-xs">{errors.plan}</span>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep('account')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 h-10 px-4 py-2 flex-1"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 flex-1"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="grid gap-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                {registrationType === "create" ? "Set up your location" : "Enter invite code"}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {registrationType === "create"
                  ? "Tell us about your business location"
                  : "Enter the invite code provided by your team"}
              </p>
            </div>

            <div className="grid gap-4">
              {registrationType === "create" ? (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="locationName" className="text-sm font-medium leading-none">
                      Business/Location Name
                    </label>
                    <input
                      id="locationName"
                      type="text"
                      placeholder="e.g., Main Street Store, Downtown Warehouse"
                      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                        errors.locationName ? "border-red-500" : ""
                      }`}
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                    <p className="text-sm text-zinc-500">
                      Enter the name of your business or the specific location where you'll be storing inventory
                    </p>
                    {errors.locationName && (
                      <span className="text-red-500 text-xs mt-1">{errors.locationName}</span>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="streetAddress" className="text-sm font-medium leading-none">
                      Street Address
                    </label>
                    <input
                      id="streetAddress"
                      type="text"
                      placeholder="123 Main St"
                      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                        errors.streetAddress ? "border-red-500" : ""
                      }`}
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                    {errors.streetAddress && (
                      <span className="text-red-500 text-xs mt-1">{errors.streetAddress}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="city" className="text-sm font-medium leading-none">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        placeholder="City"
                        className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                          errors.city ? "border-red-500" : ""
                        }`}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      {errors.city && (
                        <span className="text-red-500 text-xs mt-1">{errors.city}</span>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="state" className="text-sm font-medium leading-none">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        placeholder="State"
                        className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                          errors.state ? "border-red-500" : ""
                        }`}
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                      {errors.state && (
                        <span className="text-red-500 text-xs mt-1">{errors.state}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="zipCode" className="text-sm font-medium leading-none">
                      ZIP Code
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      placeholder="ZIP Code"
                      className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                        errors.zipCode ? "border-red-500" : ""
                      }`}
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                    {errors.zipCode && (
                      <span className="text-red-500 text-xs mt-1">{errors.zipCode}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <label htmlFor="inviteCode" className="text-sm font-medium leading-none">
                    Invite Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 ${
                      errors.inviteCode ? "border-red-500" : ""
                    }`}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                  {errors.inviteCode && (
                    <span className="text-red-500 text-xs mt-1">{errors.inviteCode}</span>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <CheckboxField>
                  <Checkbox
                    id="marketingOptIn"
                    checked={marketingOptIn}
                    onChange={(checked) => setMarketingOptIn(checked)}
                  />
                  <label htmlFor="marketingOptIn" className="text-sm font-medium leading-none">
                    I agree to receive marketing communications
                  </label>
                </CheckboxField>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(registrationType === "create" ? "plan" : "account")}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 h-10 px-4 py-2 flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-600/90 h-10 px-4 py-2 flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : registrationType === "invite" ? (
                  "Create account"
                ) : (
                  "Create account and continue to payment"
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Link
          to="/"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <div className="flex items-center gap-3">
            {isInitialized && (
              <Avatar
                src={theme === "dark" ? "/teams/logo-light.svg" : "/teams/logo-black.svg"}
                className="w-8 h-8"
              />
            )}
            <span className="text-lg font-semibold text-zinc-950 dark:text-white">
              StockCount
            </span>
          </div>
        </Link>

        {renderStep()}

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-zinc-900 dark:text-zinc-50 underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
