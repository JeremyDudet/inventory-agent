// frontend/src/components/VoiceOverlayNotificationStack.tsx
import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import { CSSProperties, useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const N_NOTIFICATIONS = 10;

const NOTIFICATION_HEIGHT = 60;
const NOTIFICATION_GAP = 8;

export default function NotificationsStack() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const stackVariants: Variants = {
    open: {
      y: 0,
      scale: 0.9,
      cursor: "default",
    },
    closed: {
      y: 0,
      scale: 1,
      cursor: "default",
    },
  };

  // Reset scroll position when collapsing
  useEffect(() => {
    if (!isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Dynamic scroll container style based on isOpen state
  const dynamicScrollContainerStyle: CSSProperties = {
    ...scrollContainerStyle,
    overflowY: isOpen ? "auto" : "hidden", // Only allow scrolling when open
  };

  const handleNotificationClick = (index: number) => {
    // Individual notification click handler
    console.log(`Notification ${index} clicked`);
    // Here you can add custom logic for each notification
  };

  return (
    <motion.div style={containerStyle} initial={false}>
      <Header
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        isDark={isDark}
      />

      <div style={scrollWrapperStyle}>
        <motion.div
          ref={scrollContainerRef}
          style={dynamicScrollContainerStyle}
          className="notifications-scroll-container"
        >
          <motion.div
            style={stackStyle}
            variants={stackVariants}
            initial={false}
            animate={isOpen ? "open" : "closed"}
            transition={{
              type: "spring",
              mass: 0.7,
            }}
          >
            {/* Hidden button for expanding the stack */}
            <button
              ref={expandButtonRef}
              data-stack-expand="true"
              onClick={() => setIsOpen(true)}
              style={{
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
                height: 0,
                width: 0,
                padding: 0,
                margin: 0,
                border: "none",
              }}
            />

            {Array.from({ length: N_NOTIFICATIONS }).map((_, i) => (
              <Notification
                key={i}
                index={i}
                onClick={() => handleNotificationClick(i)}
                isStackOpen={isOpen}
                isDark={isDark}
                onExpand={() => setIsOpen(true)}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Blur overlay for bottom fade effect - only visible when open */}
        {isOpen && <div style={blurOverlayStyle(isDark)} />}
      </div>
    </motion.div>
  );
}

const Header = ({
  isOpen,
  onClose,
  onOpen,
  isDark,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  isDark: boolean;
}) => {
  const variants: Variants = {
    open: {
      opacity: 1,
    },
    closed: {
      opacity: 1, // Always visible
    },
  };

  return (
    <motion.div
      style={headerStyle}
      variants={variants}
      initial={false}
      animate={isOpen ? "open" : "closed"}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 50,
      }}
    >
      <motion.h2
        style={{ ...headerTitleStyle, color: isDark ? "#f5f5f5" : "#0f1115" }}
      >
        Notifications
      </motion.h2>
      {isOpen ? (
        <motion.button
          style={{
            ...headerCloseStyle,
            backgroundColor: isDark ? "#333333" : "#f5f5f5",
            color: isDark ? "#f5f5f5" : "#0f1115",
          }}
          whileHover={{
            backgroundColor: isDark ? "#444444" : "#e5e5e5",
            color: isDark ? "#ffffff" : "#000000",
          }}
          onClick={onClose}
        >
          Collapse
        </motion.button>
      ) : (
        <motion.button
          style={{
            ...headerCloseStyle,
            backgroundColor: isDark ? "#333333" : "#f5f5f5",
            color: isDark ? "#f5f5f5" : "#0f1115",
          }}
          whileHover={{
            backgroundColor: isDark ? "#444444" : "#e5e5e5",
            color: isDark ? "#ffffff" : "#000000",
          }}
          onClick={onOpen}
        >
          Expand
        </motion.button>
      )}
    </motion.div>
  );
};

const Notification = ({
  index,
  onClick,
  isStackOpen,
  isDark,
  onExpand,
}: {
  index: number;
  onClick: () => void;
  isStackOpen: boolean;
  isDark: boolean;
  onExpand: () => void;
}) => {
  const variants: Variants = {
    open: {
      y: 0,
      scale: 1,
      opacity: 1,
      pointerEvents: "auto",
      cursor: "pointer",
    },
    closed: {
      y:
        -index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP) -
        NOTIFICATION_GAP * index,
      scale: 1 - index * 0.1,
      opacity: 1 - index * 0.4,
      pointerEvents: index === 0 ? "auto" : "none",
      cursor: index === 0 ? "pointer" : "default",
      zIndex: N_NOTIFICATIONS - index,
    },
  };

  const notificationStyle = getNotificationStyle(index, isDark);

  // Click handler for top notification when stack is closed
  const handleClick = () => {
    if (!isStackOpen && index === 0) {
      // If this is the top notification and stack is closed, expand the stack
      onExpand();
    } else {
      // Otherwise, handle the notification click as usual
      onClick();
    }
  };

  return (
    <motion.div
      style={notificationStyle}
      variants={variants}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 50,
        delay: index * 0.04,
      }}
      onClick={handleClick}
      whileHover={isStackOpen ? { scale: 1.02 } : undefined}
      whileTap={isStackOpen ? { scale: 0.98 } : undefined}
    >
      <div style={{ padding: "0 15px" }}>{`Notification ${index + 1}`}</div>
    </motion.div>
  );
};

/**
 * ==============   Styles   ================
 */
const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "500px",
  position: "relative",
  height: "100%", // Take full height of parent
  overflow: "hidden", // Hide any overflow
};

const scrollWrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "calc(100% - 46px)",
  marginTop: "46px",
};

const scrollContainerStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  overflowX: "hidden", // Prevent horizontal scrolling
  height: "100%", // Take full height
  paddingTop: "10px", // Add some padding at the top
  paddingBottom: "60px", // Add extra padding at bottom to account for blur overlay
};

const stackStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: NOTIFICATION_GAP,
  width: "100%",
  pointerEvents: "auto", // Ensure pointer events are enabled
};

const headerStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  height: 40,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: N_NOTIFICATIONS + 1, // Ensure header stays on top
  pointerEvents: "auto",
  padding: "6px 0",
  backgroundColor: "transparent", // Make background transparent
};

const headerTitleStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
  marginLeft: 8,
};

const headerCloseStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1,
  marginRight: 8,
  padding: "4px 12px",
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 16,
  cursor: "pointer",
  pointerEvents: "auto",
  userSelect: "none",
};

/**
 * ==============   Utils   ================
 */
function getNotificationStyle(index: number, isDark: boolean): CSSProperties {
  return {
    height: NOTIFICATION_HEIGHT,
    width: "100%",
    backgroundColor: isDark ? "#333333" : "#f5f5f5",
    borderRadius: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: N_NOTIFICATIONS - index,
    userSelect: "none",
    pointerEvents: "auto", // Always enable pointer events
    color: isDark ? "#f5f5f5" : "#0f1115",
    fontWeight: 500,
    fontSize: 14,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: `1px solid ${
      isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
    }`,
  };
}

// Function to generate blur overlay style based on theme
const blurOverlayStyle = (isDark: boolean): CSSProperties => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  height: "120px", // Height of the blur effect
  background:
    "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  // Increasing blur intensity from top to bottom
  maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
  pointerEvents: "none", // Make sure it doesn't interfere with clicking
  zIndex: N_NOTIFICATIONS + 1, // Above notifications but below header
});
