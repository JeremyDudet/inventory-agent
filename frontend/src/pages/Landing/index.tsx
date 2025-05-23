import React, { useState, useEffect } from "react";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Benefits from "./components/Benefits";
import Pricing from "./components/Pricing";
import Contact from "./components/Contact";
import FAQ from "./components/FAQ";

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      const shouldShowScrollTop = window.scrollY > 500;

      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }

      if (shouldShowScrollTop !== showScrollTop) {
        setShowScrollTop(shouldShowScrollTop);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled, showScrollTop]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <Hero />
      <Features />
      {/* <Benefits /> */}
      <Pricing />
      <FAQ />
      <Contact />
      <footer className="bg-white dark:bg-zinc-900 py-6">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Made in California with ❤️ by{" "}
            <a
              href="https://jeremydudet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-400"
            >
              Jeremy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
