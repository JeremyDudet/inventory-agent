import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/stores/themeStore";
import { motion } from "framer-motion";

const navigation = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const phoneVariants = {
  hidden: {
    y: 30,
    opacity: 0,
    scale: 0.98,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1], // Smooth easing with a slight bounce
    },
  },
};

export default function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigationClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSimpleClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white dark:bg-zinc-900">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          isScrolled
            ? "backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-gray-800"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <nav
            aria-label="Global"
            className="flex items-center justify-between p-6 lg:px-8"
          >
            <motion.div
              className="flex lg:flex-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/"
                className="-m-1.5 p-1.5 flex items-center gap-2"
                onClick={handleSimpleClick}
              >
                <span className="sr-only">StockCount</span>
                <img
                  alt="StockCount logo"
                  src={`${
                    theme === "dark"
                      ? "/teams/logo-light.svg"
                      : "/teams/logo-black.svg"
                  }`}
                  className="h-8 w-auto"
                />
                <span className="text-lg font-semibold text-zinc-950 dark:text-white">
                  StockCount
                </span>
              </Link>
            </motion.div>
            <div className="flex lg:hidden">
              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
              </motion.button>
            </div>
            <motion.div
              className="hidden lg:flex lg:gap-x-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {navigation.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100"
                  onClick={(e) => handleNavigationClick(e, item.href)}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                </motion.a>
              ))}
            </motion.div>
            <motion.div
              className="hidden lg:flex lg:flex-1 lg:justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/login"
                className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100"
              >
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            </motion.div>
          </nav>
          <Dialog
            open={mobileMenuOpen}
            onClose={setMobileMenuOpen}
            className="lg:hidden"
          >
            <div className="fixed inset-0 z-50" />
            <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-zinc-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-100/10">
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="-m-1.5 p-1.5"
                  onClick={handleSimpleClick}
                >
                  <span className="sr-only">StockCount</span>
                  <img
                    alt="StockCount logo"
                    src={`${
                      theme === "dark"
                        ? "/teams/logo-light.svg"
                        : "/teams/logo-black.svg"
                    }`}
                    className="h-8 w-auto"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10 dark:divide-gray-400/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        onClick={(e) => handleNavigationClick(e, item.href)}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                  <div className="py-6">
                    <Link
                      to="/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      onClick={handleSimpleClick}
                    >
                      Log in <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </Dialog>
        </div>
      </header>
      {/* Background pattern */}
      <div className="relative isolate pt-14">
        <svg
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full stroke-gray-200 dark:stroke-zinc-800 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        >
          <defs>
            <pattern
              x="50%"
              y={-1}
              id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg
            x="50%"
            y={-1}
            className="overflow-visible fill-gray-50 dark:fill-zinc-900"
          >
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
            width="100%"
            height="100%"
            strokeWidth={0}
          />
        </svg>
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
          <motion.div
            className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex" variants={itemVariants}>
              <div className="relative flex items-center gap-x-4 rounded-full bg-white dark:bg-zinc-800 px-4 py-1 text-sm/6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                  In Beta - Version 0.1
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 w-px bg-gray-900/10 dark:bg-gray-100/10"
                />
                <Link to="/register" className="flex items-center gap-x-1">
                  <span aria-hidden="true" className="absolute inset-0" />
                  Get your invite
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="-mr-2 size-5 text-gray-400 dark:text-gray-500"
                  />
                </Link>
              </div>
            </motion.div>
            <motion.h1
              className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-7xl"
              variants={itemVariants}
            >
              Controlling food costs is as easy as a conversation
            </motion.h1>
            <motion.p
              className="mt-8 text-pretty text-lg font-medium text-gray-500 dark:text-gray-400 sm:text-xl/8"
              variants={itemVariants}
            >
              Identify top profits and losses to make smart decisions and
              increase margins.
            </motion.p>
            <motion.div
              className="mt-10 flex items-center gap-x-6"
              variants={itemVariants}
            >
              <Link
                to="/register"
                className="rounded-md bg-zinc-950 dark:bg-zinc-100 px-3.5 py-2.5 text-sm font-bold text-white dark:text-zinc-950 shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:focus-visible:outline-zinc-100"
              >
                Join the Waitlist Now
              </Link>
              {/* <Link
                to="/#features"
                className="text-sm/6 font-medium text-gray-900 dark:text-gray-100"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link> */}
            </motion.div>
          </motion.div>
          {/* Phone mockup */}
          <motion.div
            className="mt-16 sm:mt-24 lg:mt-0 lg:shrink-0 lg:grow"
            variants={phoneVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl sm:blur-3xl lg:blur-3xl"
              >
                <div
                  style={{
                    clipPath:
                      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 20% 20%, 80% 20%, 100% 40%, 80% 60%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 20% 60%, 0% 40%, 20% 20%)",
                  }}
                  className="mx-auto aspect-[9/19.5] w-[320px] dark:w-[290px] bg-gradient-to-tr from-[#054ebb] to-[#374151] dark:from-[#5a5a5a] dark:to-[#2a2a2a] dark:opacity-60 opacity-60"
                />
              </div>
              <div className="relative mx-auto w-[22.875rem] max-w-full">
                <img
                  src="/iphone_mock.png"
                  alt="StockCount app on iPhone"
                  className="w-full h-auto drop-shadow-xl"
                  style={{
                    filter:
                      theme === "dark"
                        ? "none"
                        : "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))",
                    position: "relative",
                    zIndex: 2,
                  }}
                />
                <div
                  className="absolute overflow-hidden rounded-[36px]"
                  style={{
                    top: "2%",
                    left: "5.5%",
                    right: "5.5%",
                    bottom: "4.5%",
                    zIndex: 1,
                    aspectRatio: "9/19.5",
                  }}
                >
                  <img
                    src={
                      theme === "dark"
                        ? "/screenshots/IMG_0534.png"
                        : "/screenshots/IMG_0535.png"
                    }
                    alt="StockCount app screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
