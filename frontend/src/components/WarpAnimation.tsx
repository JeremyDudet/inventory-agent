// frontend/src/components/WarpAnimation.tsx
import { animate, AnimatePresence, motion, useMotionValue } from "motion/react";
import { useEffect, useState, ReactNode } from "react";
import ReactDOM from "react-dom";
import { XMarkIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import TranscriptionDisplay from "./TranscriptionDisplay";
import NotificationsStack from "./VoiceOverlayNotificationStack";

// Define prop types for components
interface GradientOverlayProps {
  size: { width: number; height: number };
  onClose: () => void;
  isListening: boolean;
  feedback: string;
  transcription: string;
  isFinalTranscription: boolean;
}

interface OverlayPortalProps {
  children: ReactNode;
}

interface WarpAnimationProps {
  isActive: boolean;
  intensity?: number;
  onClose: () => void;
  isListening?: boolean;
  feedback?: string;
  transcription?: string;
  isFinalTranscription?: boolean;
}

// Color schemes for light and dark modes
const colorSchemes = {
  light: {
    expandingCircleInitial: "rgb(188, 188, 191)",
    expandingCircleAnimate: "rgb(168, 168, 171)",
    gradientTopLeft: "rgb(188, 188, 191, 0.9)",
    gradientBottomRight: "rgb(168, 168, 171, 0.9)",
    overlay: "rgba(228, 228, 231, OPACITY_PLACEHOLDER)",
  },
  dark: {
    expandingCircleInitial: "rgb(39, 39, 42)",
    expandingCircleAnimate: "rgb(24, 24, 27)",
    gradientTopLeft: "rgb(39, 39, 42, 0.9)",
    gradientBottomRight: "rgb(24, 24, 27, 0.9)",
    overlay: "rgba(24, 24, 27, OPACITY_PLACEHOLDER)",
  },
};

function GradientOverlay({
  size,
  onClose,
  isListening,
  transcription,
  isFinalTranscription,
}: GradientOverlayProps) {
  const breathe = useMotionValue(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Existing dark mode and animation setup (unchanged)
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const colors = isDarkMode ? colorSchemes.dark : colorSchemes.light;

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
    // playBreathingAnimation();
  }, [breathe]);

  const enterDuration = 1;
  const exitDuration = 0.5;

  const isLargeScreen = size.width > 1440 || size.height > 900;
  const isMediumScreen = size.width > 768 || size.height > 600;
  const expandingCircleRadius =
    Math.max(size.width, size.height) * (isLargeScreen ? 0.2 : 0.3);
  const circleOpacity = isLargeScreen ? 0.9 : isMediumScreen ? 0.95 : 0.99;
  const overlayOpacity = isLargeScreen ? 0.95 : 0.95;
  const largeBlur = isLargeScreen
    ? "250px"
    : isMediumScreen
    ? "180px"
    : "150px";
  const smallBlur = isLargeScreen ? "40px" : "30px";

  return (
    <div className="gradient-container fixed inset-0 w-full h-full overflow-hidden pointer-events-auto z-[9999] select-none">
      {/* Flexbox Container for Child Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        id="warp-overlay-container"
        className="absolute inset-0 h-full max-h-screen flex flex-col w-full items-center justify-center gap-4 px-4 py-4 md:px-8 md:py-8 box-border z-[10000]"
      >
        {/* Main Content (Transcription and Notifications) */}
        <div className="flex flex-none items-center justify-center w-full max-w-[900px]">
          <TranscriptionDisplay
            text={transcription}
            isFinal={isFinalTranscription}
          />
        </div>
        <div className="flex flex-col flex-1 justify-start items-center w-full h-full overflow-y-hidden pt-2">
          <NotificationsStack />
        </div>

        {/* Feedback Display with Close Button */}
        <div
          id="warp-overlay-feedback"
          className="flex-none mt-auto flex items-center gap-3"
        >
          <div
            style={{
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.15)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              padding: "12px 24px",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              maxWidth: "80vw",
              fontFamily: "inherit",
              color: isDarkMode ? "inherit" : "rgba(0,0,0,0.85)",
              boxShadow: isDarkMode
                ? "none"
                : "0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
            }}
          >
            {isListening && (
              <div
                className="pulse-container"
                style={{
                  width: "24px",
                  height: "24px",
                  position: "relative",
                }}
              >
                <MicrophoneIcon
                  width={24}
                  height={24}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    color: "currentColor",
                  }}
                />
                <div
                  className="pulse"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "50%",
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.15)",
                    animation: "pulse 1.5s infinite",
                  }}
                ></div>
              </div>
            )}
            <p
              style={{
                margin: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "inherit",
                fontWeight: isDarkMode ? "normal" : "500",
              }}
            >
              Listening...
            </p>
          </div>
          <button
            onClick={onClose}
            className="close-button"
            style={{
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.35)"
                : "rgba(60,60,80,0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isDarkMode
                ? "1px solid rgba(255,255,255,0.5)"
                : "1px solid rgba(40,40,60,0.9)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
              color: isDarkMode ? "white" : "white",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode
                ? "rgba(255,255,255,0.5)"
                : "rgba(40,40,60,0.9)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode
                ? "rgba(255,255,255,0.35)"
                : "rgba(60,60,80,0.8)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <XMarkIcon width={24} height={24} />
          </button>
        </div>
      </motion.div>

      {/* Existing Animated Gradient Elements*/}
      <motion.div
        className="expanding-circle"
        initial={{
          scale: 0,
          opacity: 1,
          backgroundColor: colors.expandingCircleInitial,
        }}
        animate={{
          scale: 10,
          opacity: 0.2,
          backgroundColor: colors.expandingCircleAnimate,
          transition: {
            duration: enterDuration,
            opacity: { duration: enterDuration, ease: "easeInOut" },
          },
        }}
        exit={{
          scale: 0,
          opacity: 1,
          backgroundColor: colors.expandingCircleInitial,
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          left: "40%",
          bottom: "-60px",
          transform: "translateX(-50%)",
          width: expandingCircleRadius,
          height: expandingCircleRadius,
          borderRadius: "50%",
          filter: `blur(${smallBlur})`,
          transformOrigin: "center bottom",
          margin: 0,
          padding: 0,
        }}
      />
      <motion.div
        className="gradient-circle top-left"
        initial={{ opacity: 0 }}
        animate={{
          opacity: circleOpacity,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          scale: breathe,
          width: isLargeScreen ? size.width * 1.5 : size.width * 2,
          height: isLargeScreen ? size.width * 1.5 : size.width * 2,
          top: -size.width * (isLargeScreen ? 0.75 : 1),
          left: -size.width * (isLargeScreen ? 0.75 : 1),
          borderRadius: "50%",
          background: colors.gradientTopLeft,
          filter: `blur(${largeBlur})`,
        }}
      />
      <motion.div
        className="gradient-circle bottom-right"
        initial={{ opacity: 0 }}
        animate={{
          opacity: circleOpacity,
          transition: { duration: enterDuration },
        }}
        exit={{
          opacity: 0,
          transition: { duration: exitDuration },
        }}
        style={{
          position: "absolute",
          scale: breathe,
          width: isLargeScreen ? size.width * 1.5 : size.width * 2,
          height: isLargeScreen ? size.width * 1.5 : size.width * 2,
          top: size.height - size.width * (isLargeScreen ? 0.75 : 1),
          left: 0,
          borderRadius: "50%",
          background: colors.gradientBottomRight,
          filter: `blur(${largeBlur})`,
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
          background: colors.overlay.replace(
            "OPACITY_PLACEHOLDER",
            overlayOpacity.toString()
          ),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          touchAction: "none",
        }}
      />
    </div>
  );
}

// Create a portal component to render the overlay outside of the transformed content
const OverlayPortal = ({ children }: OverlayPortalProps) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or find a portal element that is a direct child of the body
    let element = document.getElementById("warp-overlay-portal");
    if (!element) {
      element = document.createElement("div");
      element.id = "warp-overlay-portal";
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      // Clean up the portal element if it's empty when component unmounts
      if (element && element.childNodes.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);

  if (!portalElement) return null;
  return ReactDOM.createPortal(children, portalElement);
};

export default function WarpAnimation({
  isActive,
  intensity = 0.1,
  onClose,
  isListening = false,
  feedback = "",
  transcription = "",
  isFinalTranscription = false,
}: WarpAnimationProps) {
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

  // Add universal scroll prevention
  useEffect(() => {
    if (!isActive) return;

    // Save current scroll position
    const scrollPos = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset,
    };

    // Check if event is within the NotificationsStack container
    const isNotificationStackEvent = (e: Event) => {
      const target = e.target as Node;
      const notificationContainer = document.querySelector(
        "#warp-overlay-container .flex-col"
      );
      return notificationContainer?.contains(target);
    };

    // Prevent wheel scrolling except in NotificationsStack
    const preventDefault = (e: Event) => {
      if (!isNotificationStackEvent(e)) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    // Force the scroll position to stay
    const lockScroll = () => window.scrollTo(scrollPos.x, scrollPos.y);

    // Disable all scroll events
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("scroll", lockScroll);

    // Find all scrollable elements and disable their scrolling
    const scrollableElements = document.querySelectorAll(
      '[style*="overflow"], [style*="overflow-y"], [style*="overflow-x"]'
    );
    const originalStyles = new Map();

    scrollableElements.forEach((element) => {
      // Skip if it's the notification container or its child
      const notificationContainer = document.querySelector(
        "#warp-overlay-container .flex-col"
      );
      if (notificationContainer?.contains(element)) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);
      const htmlElement = element as HTMLElement;

      originalStyles.set(element, {
        overflow: htmlElement.style.overflow,
        overflowY: htmlElement.style.overflowY,
        overflowX: htmlElement.style.overflowX,
      });

      htmlElement.style.overflow = "hidden";
      htmlElement.style.overflowY = "hidden";
      htmlElement.style.overflowX = "hidden";
    });

    return () => {
      // Re-enable scrolling when component unmounts or isActive changes
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("scroll", lockScroll);

      // Restore original scroll styles
      scrollableElements.forEach((element) => {
        const original = originalStyles.get(element);
        if (original) {
          const htmlElement = element as HTMLElement;

          if (original.overflow !== undefined)
            htmlElement.style.overflow = original.overflow;
          if (original.overflowY !== undefined)
            htmlElement.style.overflowY = original.overflowY;
          if (original.overflowX !== undefined)
            htmlElement.style.overflowX = original.overflowX;
        }
      });
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      // Screen size detection for responsive transformations
      const isLargeScreen =
        window.innerWidth > 1440 || window.innerHeight > 900;
      const isMediumScreen =
        window.innerWidth > 768 || window.innerHeight > 600;

      // Adjust transformation values based on screen size
      // Make effects more subtle on larger screens
      const rotateXValue = isLargeScreen ? -0.8 : isMediumScreen ? -1.2 : -1.8;
      const skewYValue = isLargeScreen ? -0.1 : isMediumScreen ? -0.15 : -0.25;
      const scaleYFactor = isLargeScreen ? 0.1 : isMediumScreen ? 0.15 : 0.2;
      const scaleXFactor = isLargeScreen ? 0.03 : isMediumScreen ? 0.04 : 0.05;

      // Disable scrolling
      const originalOverflow = document.body.style.overflow;
      const originalHeight = document.body.style.height;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalTouchAction = document.body.style.touchAction;

      // Disable all interactions on body and html
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.touchAction = "none"; // Disable touch events like pinch zoom

      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100%";
      document.documentElement.style.touchAction = "none";

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
            // Use screen size adjusted values
            appContent.style.transform = `perspective(500px) rotateX(${
              rotateXValue * value
            }deg) skewY(${skewYValue * value}deg) scaleY(${
              1 + intensity * scaleYFactor * value
            }) scaleX(${1 - intensity * scaleXFactor * value})`;
          },
        });

        // Second animation: returning to normal
        animation1.finished.then(() => {
          animate(0, 1, {
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (latest) => {
              const value = 1 - latest; // Reverse from 1 to 0
              // Use screen size adjusted values
              appContent.style.transform = `perspective(500px) rotateX(${
                rotateXValue * value
              }deg) skewY(${skewYValue * value}deg) scaleY(${
                1 + intensity * scaleYFactor * value
              }) scaleX(${1 - intensity * scaleXFactor * value})`;
            },
            onComplete: () => {
              // Restore original styles when animation completes
              appContent.style.transform = originalTransform;
              appContent.style.transition = originalTransition;
              appContent.style.transformOrigin = originalTransformOrigin;
              appContent.style.willChange = originalWillChange;

              // Re-enable scrolling and interactions
              document.body.style.overflow = originalOverflow;
              document.body.style.height = originalHeight;
              document.body.style.position = originalPosition;
              document.body.style.width = originalWidth || "";
              document.body.style.touchAction = originalTouchAction || "";

              document.documentElement.style.overflow = "";
              document.documentElement.style.height = "";
              document.documentElement.style.touchAction = "";
            },
          });
        });
      }
    }
  }, [isActive, intensity]);

  return (
    <AnimatePresence>
      {isActive && (
        <OverlayPortal>
          <GradientOverlay
            size={size}
            onClose={onClose}
            isListening={isListening}
            feedback={feedback}
            transcription={transcription}
            isFinalTranscription={isFinalTranscription}
          />
          <style>
            {`
              @supports not (backdrop-filter: blur(8px)) {
                .gradient-overlay {
                  background: rgba(150, 150, 170, 0.3) !important;
                }
              }
              
              @keyframes pulse {
                0% {
                  transform: scale(1);
                  opacity: 0.7;
                }
                70% {
                  transform: scale(1.5);
                  opacity: 0;
                }
                100% {
                  transform: scale(1);
                  opacity: 0;
                }
              }
              
              #warp-overlay-portal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                pointerEvents: "auto",
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                touch-action: none;
              }
            `}
          </style>
        </OverlayPortal>
      )}
    </AnimatePresence>
  );
}
