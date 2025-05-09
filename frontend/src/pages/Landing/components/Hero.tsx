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
    rotate: -2
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1], // Smooth easing with a slight bounce
    },
  },
};

const floatingAnimation = {
  y: [0, -8, 0],
  rotate: [0, 0.5, 0],
  scale: [1, 1.02, 1],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        isScrolled 
          ? 'backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-gray-800' 
          : 'bg-transparent border-b border-transparent'
      }`}>
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
                <Link to="/" className="-m-1.5 p-1.5" onClick={handleSimpleClick}>
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

      <div className="relative isolate pt-14">
        <motion.svg
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full stroke-gray-200 dark:stroke-zinc-700 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          animate={floatingAnimation}
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
        </motion.svg>
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
          <motion.div 
            className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex"
              variants={itemVariants}
            >
              <div className="relative flex items-center gap-x-4 rounded-full bg-white dark:bg-zinc-800 px-4 py-1 text-sm/6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                  In beta - version 0.1
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
              Inventory management as easy as a conversation
            </motion.h1>
            <motion.p 
              className="mt-8 text-pretty text-lg font-medium text-gray-500 dark:text-gray-400 sm:text-xl/8"
              variants={itemVariants}
            >
              StockCount listens, learns, and keeps your cafe's inventory
              spot-on—without the hassle.
            </motion.p>
            <motion.div 
              className="mt-10 flex items-center gap-x-6"
              variants={itemVariants}
            >
              <Link
                to="/register"
                className="rounded-md bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              >
                Get started
              </Link>
              <Link
                to="/#features"
                className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </motion.div>
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
                  className="mx-auto aspect-[1155/678] w-[90rem] bg-gradient-to-tr from-[#a78bfa] to-[#6366f1] dark:from-[#ff80b5] dark:to-[#9089fc] opacity-30 sm:opacity-20 lg:opacity-25"
                />
              </div>
              <svg
                role="img"
                viewBox="0 0 366 729"
                className="mx-auto w-[22.875rem] max-w-full drop-shadow-xl"
              >
                <title>App screenshot</title>
                <defs>
                  <clipPath id="2ade4387-9c63-4fc4-b754-10e687a0d332">
                    <rect rx={36} width={316} height={684} />
                  </clipPath>
                </defs>
                <path
                  d="M363.315 64.213C363.315 22.99 341.312 1 300.092 1H66.751C25.53 1 3.528 22.99 3.528 64.213v44.68l-.857.143A2 2 0 0 0 1 111.009v24.611a2 2 0 0 0 1.671 1.973l.95.158a2.26 2.26 0 0 1-.093.236v26.173c.212.1.398.296.541.643l-1.398.233A2 2 0 0 0 1 167.009v47.611a2 2 0 0 0 1.671 1.973l1.368.228c-.139.319-.314.533-.511.653v16.637c.221.104.414.313.56.689l-1.417.236A2 2 0 0 0 1 237.009v47.611a2 2 0 0 0 1.671 1.973l1.347.225c-.135.294-.302.493-.49.607v377.681c0 41.213 22 63.208 63.223 63.208h95.074c.947-.504 2.717-.843 4.745-.843l.141.001h.194l.086-.001 33.704.005c1.849.043 3.442.37 4.323.838h95.074c41.222 0 63.223-21.999 63.223-63.212v-394.63c-.259-.275-.48-.796-.63-1.47l-.011-.133 1.655-.276A2 2 0 0 0 366 266.62v-77.611a2 2 0 0 0-1.671-1.973l-1.712-.285c.148-.839.396-1.491.698-1.811V64.213Z"
                  fill="url(#phone-gradient)"
                  className="dark:fill-[url(#phone-gradient-dark)]"
                />
                <defs>
                  <linearGradient id="phone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E5E5EA" />
                    <stop offset="25%" stopColor="#D1D1D6" />
                    <stop offset="50%" stopColor="#C7C7CC" />
                    <stop offset="75%" stopColor="#D1D1D6" />
                    <stop offset="100%" stopColor="#E5E5EA" />
                  </linearGradient>
                  <linearGradient id="phone-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2C2C2E" />
                    <stop offset="50%" stopColor="#1C1C1E" />
                    <stop offset="100%" stopColor="#2C2C2E" />
                  </linearGradient>
                </defs>
                <path
                  d="M16 59c0-23.748 19.252-43 43-43h246c23.748 0 43 19.252 43 43v615c0 23.196-18.804 42-42 42H58c-23.196 0-42-18.804-42-42V59Z"
                  fill="url(#screen-gradient)"
                  className="dark:fill-[url(#screen-gradient-dark)]"
                  style={{
                    filter: theme === 'dark' ? 'none' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                  }}
                />
                <defs>
                  <linearGradient id="screen-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F2F2F7" />
                    <stop offset="25%" stopColor="#E5E5EA" />
                    <stop offset="50%" stopColor="#D1D1D6" />
                    <stop offset="75%" stopColor="#E5E5EA" />
                    <stop offset="100%" stopColor="#F2F2F7" />
                  </linearGradient>
                  <linearGradient id="screen-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1C1C1E" />
                    <stop offset="50%" stopColor="#2C2C2E" />
                    <stop offset="100%" stopColor="#1C1C1E" />
                  </linearGradient>
                </defs>
                <foreignObject
                  width={316}
                  height={684}
                  clipPath="url(#2ade4387-9c63-4fc4-b754-10e687a0d332)"
                  transform="translate(24 24)"
                  className="rounded-[36px] overflow-hidden"
                  style={{
                    filter: theme === 'dark' ? 'none' : 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))',
                  }}
                >
                  <img
                    alt="StockCount app screenshot"
                    src={theme === 'dark' ? '/screenshots/IMG_0534.png' : '/screenshots/IMG_0535.png'}
                    className="w-full h-full object-cover"
                  />
                </foreignObject>
                {/* Dynamic Island Pill */}
                <rect
                  x="138"
                  y="35"
                  width="90"
                  height="25"
                  rx="12.5"
                  // fill="url(#pill-gradient)"
                  className="dark:fill-[url(#pill-gradient-dark)]"
                  style={{ zIndex: 10 }}
                />
                <defs>
                  <linearGradient id="pill-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#48484A" />
                    <stop offset="50%" stopColor="#636366" />
                    <stop offset="100%" stopColor="#48484A" />
                  </linearGradient>
                  <linearGradient id="pill-gradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="50%" stopColor="#1C1C1E" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
