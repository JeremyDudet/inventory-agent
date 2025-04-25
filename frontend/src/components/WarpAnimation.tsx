import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { XMarkIcon, MicrophoneIcon } from "@heroicons/react/24/outline";

function GradientOverlay({
  size,
  onClose,
  isListening,
  feedback,
}: {
  size: { width: number; height: number };
  onClose: () => void;
  isListening: boolean;
  feedback: string;
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
  const largeBlur = isLargeScreen ? "150px" : isMediumScreen ? "100px" : "80px";
  const smallBlur = isLargeScreen ? "20px" : "15px";

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
        pointerEvents: "none",
        zIndex: 9999,
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
            backgroundColor: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            color: "white",
          }}
        >
          <XMarkIcon width={24} height={24} />
        </button>
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
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "12px 24px",
            borderRadius: "24px",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            maxWidth: "80vw",
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
                  color: "white",
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
            }}
          >
            {feedback ||
              (isListening ? "Listening..." : "Voice control activated")}
          </p>
        </div>
      </div>

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
          background: "rgb(246, 63, 42, 0.9)",
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
          background: "rgb(243, 92, 76, 0.9)",
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
          background: `rgba(246, 63, 42, ${overlayOpacity})`,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />
    </div>
  );
}

// Create a portal component to render the overlay outside of the transformed content
const OverlayPortal = ({ children }: { children: React.ReactNode }) => {
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
}: {
  isActive: boolean;
  intensity?: number;
  onClose: () => void;
  isListening?: boolean;
  feedback?: string;
}) {
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

      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

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

              // Re-enable scrolling
              document.body.style.overflow = originalOverflow;
              document.body.style.height = originalHeight;
              document.body.style.position = originalPosition;
              document.body.style.width = "";
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
          />
          <style>
            {`
              @supports not (backdrop-filter: blur(2px)) {
                .gradient-overlay {
                  background: rgba(246, 63, 42, 0.3) !important;
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
            `}
          </style>
        </OverlayPortal>
      )}
    </AnimatePresence>
  );
}
