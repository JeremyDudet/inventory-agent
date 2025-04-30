// frontend/src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { ApiError } from "../services/api";
import ReactDOM from "react-dom";

// Define notification type
export type NotificationType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "auth-error";

// Define notification interface
interface NotificationData {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  visible: boolean;
}

// Define context interface
interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (
    type: NotificationType,
    message: string,
    duration?: number
  ) => void;
  showApiError: (
    error: Error | ApiError,
    fallbackMessage?: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  showApiError: () => {},
  removeNotification: () => {},
});

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [desktopSidebarEl, setDesktopSidebarEl] = useState<HTMLElement | null>(
    null
  );
  const [mobileSidebarEl, setMobileSidebarEl] = useState<HTMLElement | null>(
    null
  );
  const [mobileTopEl, setMobileTopEl] = useState<HTMLElement | null>(null);

  // Check if notification areas are ready
  useEffect(() => {
    const checkElements = () => {
      // For desktop sidebar notification area
      const desktopSidebarNotificationsEl = document.getElementById(
        "sidebar-notifications"
      );

      // For mobile sidebar notification area
      const mobileSidebarNotificationsEl = document.getElementById(
        "sidebar-notifications-mobile"
      );

      // For mobile top notifications (below search bar)
      let mobileTopNotificationsEl = document.getElementById(
        "mobile-notifications-container"
      );

      if (!mobileTopNotificationsEl) {
        // If the container doesn't exist, create it
        mobileTopNotificationsEl = document.createElement("div");
        mobileTopNotificationsEl.id = "mobile-notifications-container";
        mobileTopNotificationsEl.className =
          "fixed top-16 z-40 left-0 right-0 px-4 py-1 lg:hidden";

        // Find the main element to insert before
        const mainElement = document.querySelector("main");
        if (mainElement && mainElement.parentNode) {
          mainElement.parentNode.insertBefore(
            mobileTopNotificationsEl,
            mainElement
          );
        } else {
          // Fallback if we can't find the main element
          document.body.appendChild(mobileTopNotificationsEl);
        }
      }

      setDesktopSidebarEl(desktopSidebarNotificationsEl);
      setMobileSidebarEl(mobileSidebarNotificationsEl);
      setMobileTopEl(mobileTopNotificationsEl);
    };

    // Check immediately and then with a slight delay to ensure DOM is ready
    checkElements();
    const timer = setTimeout(checkElements, 500);

    // Also add a mutation observer to catch when the elements are added to the DOM
    const observer = new MutationObserver(() => {
      checkElements();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Add a new notification
  const addNotification = (
    type: NotificationType,
    message: string,
    duration = 5000
  ) => {
    const id =
      Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);

    // Limit to maximum 3 notifications at once
    setNotifications((prev) => {
      const newNotifications = [
        ...prev,
        { id, type, message, duration, visible: true },
      ];
      // If more than 3, remove the oldest one
      return newNotifications.length > 3
        ? newNotifications.slice(-3)
        : newNotifications;
    });

    // Auto-remove notification after duration
    if (duration !== 0) {
      setTimeout(() => {
        // First set visible to false to trigger animation
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? { ...notification, visible: false }
              : notification
          )
        );
      }, duration);
    }
  };

  // Remove a notification by ID
  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  // Show API error with appropriate styling based on error type
  const showApiError = (
    error: Error | ApiError,
    fallbackMessage = "An error occurred",
    duration = 6000
  ) => {
    const apiError = error as ApiError;

    // Determine if this is an auth/permission error
    const isAuthError =
      apiError.isAuthError ||
      apiError.status === 401 ||
      apiError.status === 403;

    // Get the error message
    const errorMessage = error.message || fallbackMessage;

    // Add notification with appropriate type
    addNotification(
      isAuthError ? "auth-error" : "error",
      errorMessage,
      duration
    );

    // If it's an auth error, handle potential redirection
    if (isAuthError) {
      console.warn("Authentication error:", error);
      // You could trigger auth-related actions here if needed
      // such as showing a login modal or redirecting to login page
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        showApiError,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
