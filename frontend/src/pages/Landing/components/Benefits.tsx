import { useThemeStore } from "@/stores/themeStore";

export default function Benefits() {
  const { theme } = useThemeStore();
  return (
    <div className="bg-white dark:bg-zinc-900 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-base/7 font-semibold text-zinc-600 dark:text-zinc-400">
          Stress-free inventory
        </h2>
        <p className="mt-2 max-w-lg text-pretty text-4xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          Everything you need to manage your stock
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
          <div className="relative lg:col-span-3">
            <div className="absolute inset-px rounded-lg bg-white dark:bg-zinc-800 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-performance.png"
                className="h-80 object-cover object-left"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-zinc-600 dark:text-zinc-400">
                  Reduce Stress
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Focus on what matters
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  StockCount.io helps you manage your stock effortlessly, so you
                  can focus on what matters most: your customers.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/5 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
          </div>
          <div className="relative lg:col-span-3">
            <div className="absolute inset-px rounded-lg bg-white dark:bg-zinc-800 lg:rounded-tr-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-releases.png"
                className="h-80 object-cover object-left lg:object-right"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-zinc-600 dark:text-zinc-400">
                  Save Time
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Update stock in seconds
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  No more manual logs or spreadsheets. With voice commands and
                  instant updates, StockCount.io frees up hours for your busy
                  day.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/5 lg:rounded-tr-[2rem]" />
          </div>
          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-white dark:bg-zinc-800 lg:rounded-bl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-speed.png"
                className="h-80 object-cover object-left"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-zinc-600 dark:text-zinc-400">
                  Boost Accuracy
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Fewer mistakes
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  StockCount.io listens closely and learns your workflow,
                  helping you cut down errors so your inventory is always
                  spot-on.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/5 lg:rounded-bl-[2rem]" />
          </div>
          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-white dark:bg-zinc-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
              <img
                alt=""
                src={
                  theme === "dark"
                    ? "/screenshots/IMG_0536.png"
                    : "/screenshots/IMG_0537.png"
                }
                className="h-80 object-cover object-bottom"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-zinc-600 dark:text-zinc-400">
                  Fit Your Flow
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Voice controls and manual fallback
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Designed for cafes, StockCount.io adapts to your team's pace
                  with voice controls and a fallback manual option for any
                  situation.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/5" />
          </div>
          <div className="relative lg:col-span-2">
            <div className="absolute inset-px rounded-lg bg-white dark:bg-zinc-800 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <img
                alt=""
                src="https://tailwindcss.com/plus-assets/img/component-images/bento-01-network.png"
                className="h-80 object-cover"
              />
              <div className="p-10 pt-4">
                <h3 className="text-sm/4 font-semibold text-zinc-600 dark:text-zinc-400">
                  Grow Confidently
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Real-time insights
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  StockCount.io gives you real-time insights so you can make
                  informed decisions and grow with confidence.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 dark:ring-white/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}
