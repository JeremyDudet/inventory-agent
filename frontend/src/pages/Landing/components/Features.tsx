import {
  MicrophoneIcon,
  LightBulbIcon,
  ClockIcon,
  InboxArrowDownIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Inventory Management",
    description: "Voice-Controlled Inventory: Update stock hands-free...",
    href: "#voice-interface",
    icon: MicrophoneIcon,
  },
  {
    name: "Invoice Processing",
    description: "Automated Invoice Processing: Snap a photo...",
    href: "#contextual-understanding",
    icon: InboxArrowDownIcon,
  },
  {
    name: "Cost Tracking",
    description: "Real-Time Cost Tracking: See your food costs...",
    href: "#quick-response",
    icon: ClockIcon,
  },
  {
    name: "Profitability Insights",
    description: "Menu Profitability Insights: Know which dishes...",
    href: "#quick-response",
    icon: ClockIcon,
  },
];

export default function Features() {
  return (
    <div id="features" className="bg-white dark:bg-zinc-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            What Your Business Needs. Made Simple.
          </h2>
          {/* <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-400">
            StockCount.io makes inventory management intuitive and stress-free.
            Our innovative features let you update and track stock effortlessly,
            so your team can focus on delighting customers.
          </p> */}
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
                <dd className="mt-1 flex flex-auto flex-col text-base/7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <a
                      href={feature.href}
                      className="text-sm/6 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
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
