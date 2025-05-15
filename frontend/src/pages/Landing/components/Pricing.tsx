// frontend/src/pages/Landing/components/Pricing.tsx
import { useState } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";

const tiers = [
  {
    name: "Starter",
    id: "tier-starter",
    href: "#",
    priceMonthly: "$29",
    priceYearly: "$313", // 29 * 12 * 0.9 = 313.2, rounded to 313
    description: "For home-based chefs and solo operators.",
    features: [
      "Voice-controlled stock counting",
      "Invoice processing",
      "COGS tracking",
      "Cost per Menu Item",
      "Auto Generated Shopping lists",
      "Activity logging",
      "Up to 3 users",
    ],
    notBuiltFeatures: [
      "Recipe management",
      "POS integration",
      "AI agent - for asking general questions and perform actions using simple voice commands",
      "Multi-language support",
    ], // No not-built features for Starter
    featured: false,
  },
  {
    name: "Small Business",
    id: "tier-small",
    href: "#",
    priceMonthly: "$79",
    priceYearly: "$849", // 79 * 12 * 0.9 = 852.6, rounded to 853
    description: "Ideal for small cafes and restaurants.",
    features: [
      "Voice-controlled stock counting",
      "Invoice processing",
      "COGS tracking",
      "Cost per Menu Item",
      "Auto Generated Shopping lists",
      "Activity logging",
      "Up to 10 users",
    ],
    notBuiltFeatures: [
      "Recipe management",
      "Labor Cost tracking",
      "POS integration",
      "Accounting Software Integration",
      "AI agent - for asking general questions and perform actions using simple voice commands",
      "Multi-language support",
    ],
    featured: true,
  },
  {
    name: "Medium Business",
    id: "tier-medium",
    href: "#",
    priceMonthly: "$189",
    priceYearly: "$2,039", // 189 * 12 * 0.9 = 2079.6, rounded to 2079
    description: "For scaling your business with multiple locations.",
    features: [
      "Voice-controlled stock counting",
      "Invoice processing",
      "COGS tracking",
      "Menu item COGS analysis",
      "Shopping lists",
      "Activity logging",
      "Vendor-specific shopping lists",
      "Usage trend analytics",
      "Up to 20 users",
    ],
    notBuiltFeatures: [
      "Recipe management",
      "Labor Cost tracking",
      "POS integration",
      "Accounting Software Integration",
      "AI agent - for asking general questions and perform actions using simple voice commands",
      "Multi-language support",
    ],
    featured: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const handleBillingCycleChange = (cycle: string) => {
    setBillingCycle(cycle);
  };

  return (
    <div
      id="pricing"
      className="relative isolate bg-white dark:bg-zinc-900 px-6 py-24 sm:py-32 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
        />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-5xl sm:text-6xl font-semibold text-zinc-900 dark:text-white">
          Pricing
        </h2>
        <p className="mt-2 text-balance text-base sm:text-md font-semibold tracking-tight text-gray-900 dark:text-zinc-200">
          Choose the right plan for you
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleBillingCycleChange("monthly")}
            className={classNames(
              billingCycle === "monthly"
                ? "bg-zinc-950 dark:bg-zinc-500 text-white"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
              "rounded-md px-4 py-2 text-sm font-semibold"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => handleBillingCycleChange("yearly")}
            className={classNames(
              billingCycle === "yearly"
                ? "bg-zinc-950 dark:bg-zinc-500 text-white"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
              "rounded-md px-4 py-2 text-sm font-semibold"
            )}
          >
            Yearly (Save 10%)
          </button>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-5xl lg:grid-cols-3 lg:gap-x-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured
                ? "relative bg-white dark:bg-zinc-800 shadow-2xl"
                : "bg-white/60 dark:bg-zinc-800/60",
              "rounded-3xl p-8 ring-1 ring-gray-900/10 dark:ring-gray-100/10 sm:p-10"
            )}
          >
            <h3
              id={tier.id}
              className="text-base/7 font-semibold text-zinc-600 dark:text-zinc-400"
            >
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {billingCycle === "monthly"
                  ? tier.priceMonthly
                  : tier.priceYearly}
              </span>
              <span className="text-base text-gray-500 dark:text-gray-400">
                {billingCycle === "monthly" ? "/month" : "/year"}
              </span>
            </p>
            <p className="mt-6 text-base/7 text-gray-600 dark:text-gray-400">
              {tier.description}
            </p>
            <ul
              role="list"
              className="mt-8 space-y-3 text-sm/6 text-gray-600 dark:text-gray-400 sm:mt-10"
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    aria-hidden="true"
                    className="h-6 w-5 flex-none text-zinc-600 dark:text-zinc-400"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            {tier.notBuiltFeatures.length > 0 && (
              <>
                <h4 className="mt-6 text-sm font-semibold text-gray-900 dark:text-white">
                  Coming soon
                </h4>
                <ul
                  role="list"
                  className="mt-2 space-y-3 text-sm/6 text-gray-500 dark:text-gray-400"
                >
                  {tier.notBuiltFeatures.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        aria-hidden="true"
                        className="h-6 w-5 flex-none text-gray-300 dark:text-gray-600"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <a
              href={tier.href}
              aria-describedby={tier.id}
              className={classNames(
                tier.featured
                  ? "bg-zinc-950 dark:bg-zinc-500 text-white shadow hover:bg-zinc-800 dark:hover:bg-zinc-400"
                  : "text-zinc-600 dark:text-zinc-400 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 hover:ring-zinc-300 dark:hover:ring-zinc-700",
                "mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-zinc-400 sm:mt-10"
              )}
            >
              Get started today
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
