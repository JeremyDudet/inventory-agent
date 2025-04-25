import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

function GradientOverlay({
  size,
}: {
  size: { width: number; height: number };
}) {
  const breathe = useMotionValue(0);

  useEffect(() => {
    async function playBreathingAnimation() {
      await animate(breathe, 1, {
        duration: 0.5,
        delay: 0.35,
        ease: [0, 0.55, 0.45, 1],
      });

      animate(breathe, [null, 0.7, 1], {
        duration: 15,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      });
    }

    playBreathingAnimation();
  }, [breathe]);

  const enterDuration = 0.75;
  const exitDuration = 0.5;

  const expandingCircleRadius = size.width / 3;

  return (
    <div
      className="gradient-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <motion.div
        className="expanding-circle"
        initial={{
          scale: 0,
          opacity: 1,
          backgroundColor: "rgb(233, 167, 160)",
        }}
        animate={{
          scale: 10,
          opacity: 0.2,
          backgroundColor: "rgb(246, 63, 42)",
          transition: {
            duration: enterDuration,
            opacity: { duration: enterDuration, ease: "easeInOut" },
          },
        }}
        exit={{
          scale: 0,
          opacity: 1,
          backgroundColor: "rgb(233, 167, 160)",
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: expandingCircleRadius,
          height: expandingCircleRadius,
          borderRadius: "50%",
          filter: "blur(15px)",
        }}
      />

      <motion.div
        className="gradient-circle top-left"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.9,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          scale: breathe,
          width: size.width * 2,
          height: size.width * 2,
          top: -size.width,
          left: -size.width,
          borderRadius: "50%",
          background: "rgb(246, 63, 42, 0.9)",
          filter: "blur(100px)",
        }}
      />

      <motion.div
        className="gradient-circle bottom-right"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.9,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          scale: breathe,
          width: size.width * 2,
          height: size.width * 2,
          top: size.height - size.width,
          left: 0,
          borderRadius: "50%",
          background: "rgb(243, 92, 76, 0.9)",
          filter: "blur(100px)",
        }}
      />
      <motion.div
        className="gradient-overlay"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          background: "rgba(246, 63, 42, 0.1)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />
    </div>
  );
}

export default function WarpAnimation({
  isActive,
  intensity = 0.1,
}: {
  isActive: boolean;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const deform = useMotionValue(0);

  useEffect(() => {
    if (isActive) {
      // Apply transformation to HTML or body element directly
      const appContent =
        document.querySelector("#root") ||
        document.querySelector("body > div") ||
        document.body;

      if (appContent instanceof HTMLElement) {
        // Save original styles
        const originalTransform = appContent.style.transform;
        const originalTransition = appContent.style.transition;
        const originalTransformOrigin = appContent.style.transformOrigin;
        const originalWillChange = appContent.style.willChange;

        // Set initial transform origin for proper deformation
        appContent.style.transformOrigin = "50% 0%";
        appContent.style.willChange = "transform";

        // First animation: applying the deformation
        const animation1 = animate(0, 1, {
          duration: 0.3,
          ease: [0.65, 0, 0.35, 1],
          onUpdate: (value) => {
            appContent.style.transform = `perspective(500px) rotateX(${
              -5 * value
            }deg) skewY(${-1.5 * value}deg) scaleY(${
              1 + intensity * value
            }) scaleX(${1 - intensity * 0.6 * value})`;
          },
        });

        // Second animation: returning to normal
        animation1.finished.then(() => {
          animate(0, 1, {
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (latest) => {
              const value = 1 - latest; // Reverse from 1 to 0
              appContent.style.transform = `perspective(500px) rotateX(${
                -5 * value
              }deg) skewY(${-1.5 * value}deg) scaleY(${
                1 + intensity * value
              }) scaleX(${1 - intensity * 0.6 * value})`;
            },
            onComplete: () => {
              // Restore original styles when animation completes
              appContent.style.transform = originalTransform;
              appContent.style.transition = originalTransition;
              appContent.style.transformOrigin = originalTransformOrigin;
              appContent.style.willChange = originalWillChange;
            },
          });
        });
      }
    }
  }, [isActive, intensity]);

  return (
    <AnimatePresence>
      {isActive && <GradientOverlay size={size} />}
      <style>
        {`
          @supports not (backdrop-filter: blur(2px)) {
            .gradient-overlay {
              background: rgba(246, 63, 42, 0.3) !important;
            }
          }
        `}
      </style>
    </AnimatePresence>
  );
}
