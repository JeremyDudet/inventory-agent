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

  const stackVariants: Variants = {
    open: {
      y: 20,
      scale: 0.9,
      cursor: "default",
    },
    closed: {
      y: 0,
      scale: 1,
      cursor: "default",
    },
  };

  const handleNotificationClick = (index: number) => {
    // Individual notification click handler
    console.log(`Notification ${index} clicked`);
    // Here you can add custom logic for each notification
  };

  return (
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

      <Header
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        isDark={isDark}
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
      y: 0,
      scale: 1,
      opacity: 1,
    },
    closed: {
      y: 60,
      scale: 0.8,
      opacity: 0,
    },
  };

  return (
    <motion.div
      style={headerStyle}
      variants={variants}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 50,
        delay: isOpen ? 0.2 : 0,
      }}
    >
      <motion.h2
        style={{ ...headerTitleStyle, color: isDark ? "#f5f5f5" : "#0f1115" }}
      >
        Notifications
      </motion.h2>
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
const stackStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: NOTIFICATION_GAP,
  width: "100%",
  maxWidth: "500px",
  pointerEvents: "auto", // Ensure pointer events are enabled
};

const headerStyle: CSSProperties = {
  position: "absolute",
  top: -40,
  left: 0,
  height: 28,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transformOrigin: "bottom center",
  pointerEvents: "none",
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
