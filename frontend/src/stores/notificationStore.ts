import { create } from "zustand";
import { ApiError } from "../services/api";

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

interface NotificationState {
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

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  addNotification: (type, message, duration = 5000) => {
    const id =
      Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);

    set((state) => {
      const newNotifications = [
        ...state.notifications,
        { id, type, message, duration, visible: true },
      ];
      // If more than 3, remove the oldest one
      const limitedNotifications =
        newNotifications.length > 3
          ? newNotifications.slice(-3)
          : newNotifications;

      // Auto-remove notification after duration
      if (duration !== 0) {
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === id
                ? { ...notification, visible: false }
                : notification
            ),
          }));
        }, duration);
      }

      return { notifications: limitedNotifications };
    });
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    }));
  },
  showApiError: (
    error,
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
    set((state) => {
      const id =
        Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
      const newNotifications = [
        ...state.notifications,
        {
          id,
          type: isAuthError
            ? ("auth-error" as NotificationType)
            : ("error" as NotificationType),
          message: errorMessage,
          duration,
          visible: true,
        },
      ];

      // If more than 3, remove the oldest one
      const limitedNotifications =
        newNotifications.length > 3
          ? newNotifications.slice(-3)
          : newNotifications;

      // Auto-remove notification after duration
      if (duration !== 0) {
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === id
                ? { ...notification, visible: false }
                : notification
            ),
          }));
        }, duration);
      }

      return { notifications: limitedNotifications };
    });

    // If it's an auth error, handle potential redirection
    if (isAuthError) {
      console.warn("Authentication error:", error);
      // You could trigger auth-related actions here if needed
      // such as showing a login modal or redirecting to login page
    }
  },
}));
