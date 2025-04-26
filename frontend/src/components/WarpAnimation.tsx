import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, ReactNode } from "react";
import ReactDOM from "react-dom";
import { XMarkIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import TranscriptionDisplay from "./TranscriptionDisplay";
import NotificationsStack from "./VoiceOverlayNotificationStack";

// Define prop types for TranscriptionDisplay
interface TranscriptionDisplayProps {
  text: string;
  isFinal: boolean;
  className?: string;
}

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
    expandingCircleInitial: "rgb(200, 200, 210)",
    expandingCircleAnimate: "rgb(150, 150, 170)",
    gradientTopLeft: "rgb(150, 150, 170, 0.9)",
    gradientBottomRight: "rgb(120, 120, 140, 0.9)",
    overlay: "rgba(150, 150, 170, OPACITY_PLACEHOLDER)",
  },
  dark: {
    expandingCircleInitial: "rgb(80, 80, 100)",
    expandingCircleAnimate: "rgb(60, 60, 80)",
    gradientTopLeft: "rgb(60, 60, 80, 0.9)",
    gradientBottomRight: "rgb(40, 40, 60, 0.9)",
    overlay: "rgba(60, 60, 80, OPACITY_PLACEHOLDER)",
  },
};

function GradientOverlay({
  size,
  onClose,
  isListening,
  feedback,
  transcription,
  isFinalTranscription,
}: GradientOverlayProps) {
  const breathe = useMotionValue(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const checkDarkMode = () => {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Get the current color scheme based on mode
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

    playBreathingAnimation();
  }, [breathe]);

  const enterDuration = 0.75;
  const exitDuration = 0.5;

  // Responsive sizing & opacity adjustments
  const isLargeScreen = size.width > 1440 || size.height > 900;
  const isMediumScreen = size.width > 768 || size.height > 600;

  // Adjust size based on screen dimensions
  const expandingCircleRadius =
    Math.max(size.width, size.height) * (isLargeScreen ? 0.2 : 0.3);

  // Adjust opacity based on screen size
  const circleOpacity = isLargeScreen ? 0.6 : isMediumScreen ? 0.8 : 0.9;
  const overlayOpacity = isLargeScreen ? 0.08 : 0.1;

  // Adjust blur based on screen size
  const largeBlur = isLargeScreen
    ? "250px"
    : isMediumScreen
    ? "180px"
    : "150px";
  const smallBlur = isLargeScreen ? "40px" : "30px";

  return (
    <div
      className="gradient-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 9999,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      {/* Close button */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 10000,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={onClose}
          className="close-button"
          style={{
            backgroundColor: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            color: "white",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.35)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <XMarkIcon width={24} height={24} />
        </button>
      </div>

      {/* Notifications Stack */}
      <div
        style={{
          position: "absolute",
          top: "260px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10000,
          pointerEvents: "auto",
          width: "90%",
          maxWidth: "450px",
          touchAction: "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <NotificationsStack />
      </div>

      {/* Transcription display */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: "800px",
          textAlign: "center",
          zIndex: 10000,
          height: "200px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "auto",
        }}
      >
        <TranscriptionDisplay
          text={transcription}
          isFinal={isFinalTranscription}
          className="warp-transcription"
        />
      </div>

      {/* Feedback display */}
      <div
        style={{
          position: "absolute",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          pointerEvents: "auto",
          zIndex: 10000,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "12px 24px",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            maxWidth: "80vw",
            fontFamily: "inherit",
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
                  background: "rgba(255, 255, 255, 0.2)",
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
            }}
          >
            Listening...
          </p>
        </div>
      </div>

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

    // Prevent wheel scrolling
    const preventDefault = (e: Event) => {
      e.preventDefault();
      return false;
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
      const rotateXValue = isLargeScreen ? -0.8 : isMediumScreen ? -1.2 : -1.5;
      const skewYValue = isLargeScreen ? -0.1 : isMediumScreen ? -0.15 : -0.2;
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
              
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
              
              .transcription-container {
                margin: 10px auto;
                width: 100%;
                max-width: 90vw;
                box-sizing: border-box;
                padding: 0 10px;
                max-height: 60vh;
                overflow-y: hidden;
                text-align: left;
                /* Add fade effect at the top */
                mask-image: linear-gradient(
                  to top,
                  rgba(0, 0, 0, 1) 60%,
                  rgba(0, 0, 0, 0) 100%
                );
                -webkit-mask-image: linear-gradient(
                  to top,
                  rgba(0, 0, 0, 1) 60%,
                  rgba(0, 0, 0, 0) 100%
                );
                /* Limit height to approximately 4 lines */
                height: 12em;
                /* Use flexbox to position content at the bottom */
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                position: relative;
              }
              
              .transcription-content {
                display: inline;
                white-space: normal;
                text-align: left;
              }
              
              .transcription-text {
                font-size: 1.6rem;
                margin: 0;
                padding: 0;
                word-wrap: break-word;
                overflow-wrap: break-word;
                font-family: inherit;
                opacity: 1;
                white-space: pre-wrap;
              }
              
              .cursor-animation {
                animation: blink 1.5s infinite;
                font-weight: normal;
                display: inline-block;
                font-size: 1.6rem;
                color: white;
                text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
                line-height: normal;
              }
              
              @media (max-width: 768px) {
                .transcription-container {
                  max-width: 95vw;
                  max-height: 50vh;
                  height: 10em;
                }
                
                .transcription-text {
                  font-size: 1.3rem;
                }
              }
              
              .warp-transcription h2 {
                font-size: 1.75rem;
                font-weight: 600;
                width: 100%;
                max-width: 100%;
                font-family: inherit;
              }
              
              @media (max-width: 480px) {
                .warp-transcription h2 {
                  font-size: 1rem;
                }
              }
              
              @media (max-width: 320px) {
                .warp-transcription h2 {
                  font-size: 0.875rem;
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
