import {
  MicrophoneIcon,
  LightBulbIcon,
  ClockIcon,
  InboxArrowDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const features = [
  {
    name: "Voice controlled stock counting",
    shortDescription: (
      <>
        <span className="font-bold italic">TLDR;</span> Wear headphones, walk
        store, speak inventory (e.g., '15 lbs dark roast coffee'), app records
        it.
      </>
    ),
    longDescription: (
      <>
        <span>
          There are two ways for us to keep track of our inventory levels.
          Perpetual and Periodic methods. Perpetual inventory uses POS systems
          to auto-subtract sales but often misses spoilage, spillage, waste, or
          theft, making it less accurate. Periodic inventory, though tedious,
          requires physical counts (daily, weekly, etc.) for true stock levels.
        </span>
        <br />
        <br />
        <span>
          This voice-input feature simplifies physical counts, eliminating
          printed sheets, clipboards, or complex digital menus. Manual entry
          remains available as a backup.
        </span>
      </>
    ),
    href: "#voice-interface",
    icon: MicrophoneIcon,
  },
  {
    name: "Invoice Processing",
    shortDescription: (
      <>
        Send your invoices; we parse them to identify inventory item prices,
        revealing true costs.
      </>
    ),
    longDescription: (
      <span>
        Our invoice processing feature extracts prices from submitted invoices,
        calculating the true cost of your menu items. This enables accurate
        profit margin analysis and provides insights for effective menu
        engineering.
      </span>
    ),
    href: "#invoice-processing",
    icon: InboxArrowDownIcon,
  },
  {
    name: "Cost Tracking",
    shortDescription: <>Track COGS for your business and per menu item.</>,
    longDescription: (
      <span>
        Our cost tracking feature calculates your business's total COGS and
        per-menu-item costs by analyzing inventory counts and submitted
        invoices. This streamlines profit margin analysis and supports
        data-driven menu engineering.
      </span>
    ),
    href: "#cost-tracking",
    icon: CurrencyDollarIcon,
  },
  {
    name: "Auto-generated shopping lists",
    shortDescription: (
      <>
        Generate shopping lists based on usage trends and par levels, set
        manually or auto-calculated by the app.
      </>
    ),
    longDescription: (
      <>
        <span>
          Our shopping list feature uses stock count data to analyze inventory
          usage trends over time. You can set custom par levels or let the app
          automatically determine optimal levels based on historical data.
        </span>
        <br />
        <br />
        <span>
          Generate tailored, vendor-specific shopping lists to order the right
          quantities, preventing stockouts. View lists by vendor for streamlined
          ordering, saving time and ensuring complete inventory replenishment.
        </span>
      </>
    ),
    href: "#auto-generated-shopping-lists",
    icon: ShoppingCartIcon,
  },
  {
    name: "Team collaboration",
    shortDescription: (
      <>Add team members to manage inventory with robust activity logging.</>
    ),
    longDescription: (
      <>
        <span>
          Our team member feature lets you invite staff to collaborate on
          inventory tasks, assigning roles for stock counting, invoice
          processing, or shopping list management. A robust logging system
          tracks who did what and when.
        </span>
        <br />
        <br />
        <span>
          This ensures accountability, reduces errors, and streamlines
          operations, whether for you're a home-based chef coordinating with
          helpers or a small restaurant managing multiple team members.
        </span>
      </>
    ),
    href: "#team-collaboration",
    icon: UserGroupIcon,
  },
];

export default function Features() {
  const [expandedFeatures, setExpandedFeatures] = useState<
    Record<string, boolean>
  >({});

  const toggleFeature = (featureName: string) => {
    setExpandedFeatures((prev) => ({
      ...prev,
      [featureName]: !prev[featureName],
    }));
  };

  return (
    <div id="features" className="bg-white dark:bg-zinc-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Current features:
          </h2>
          <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-400">
            <span className="font-bold italic">Still under development.</span>{" "}
            More features coming soon!
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-base/7 font-semibold text-gray-900 dark:text-white">
                  <div className="mb-6 flex size-10 items-center justify-center rounded-lg bg-zinc-950 dark:bg-zinc-500">
                    <feature.icon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-1 flex flex-col text-base/7 text-gray-600 dark:text-gray-400">
                  <p className="flex-none">{feature.shortDescription}</p>
                  {feature.longDescription && (
                    <div
                      className={`mt-6 transition-all duration-300 ${
                        expandedFeatures[feature.name]
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <p className="break-normal">{feature.longDescription}</p>
                    </div>
                  )}
                  <p className="mt-8 [@media(min-width:1024px)]:mt-20 [@media(min-width:1060px)]:mt-8">
                    <button
                      onClick={() => toggleFeature(feature.name)}
                      className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {expandedFeatures[feature.name]
                        ? "Show less"
                        : "Learn more"}{" "}
                      {expandedFeatures[feature.name] ? (
                        <ChevronUpIcon className="inline-block h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="inline-block h-4 w-4" />
                      )}
                    </button>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
