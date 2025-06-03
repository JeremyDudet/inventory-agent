import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { XMarkIcon, ArrowUturnLeftIcon } from "@heroicons/react/20/solid";
import {
  useNotificationStore,
  NotificationType,
  UndoAction,
} from "@/stores/notificationStore";

const GlobalNotifications: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();
  const [processingUndo, setProcessingUndo] = useState<string | null>(null);

  // Auto-remove notifications when they become invisible
  useEffect(() => {
    const visibleNotifications = notifications.filter((n) => n.visible);
    const invisibleNotifications = notifications.filter((n) => !n.visible);

    if (invisibleNotifications.length > 0) {
      const timeout = setTimeout(() => {
        invisibleNotifications.forEach((notification) => {
          removeNotification(notification.id);
        });
      }, 300); // Wait for fade out animation

      return () => clearTimeout(timeout);
    }
  }, [notifications, removeNotification]);

  const handleUndo = async (undoAction: UndoAction, notificationId: string) => {
    setProcessingUndo(notificationId);

    try {
      await undoAction.action();
      // Remove the notification after successful undo
      removeNotification(notificationId);

      // Show confirmation that undo was successful
      const { addNotification } = useNotificationStore.getState();
      addNotification("info", "Action undone successfully", 3000);
    } catch (error) {
      console.error("Failed to undo action:", error);
      const { addNotification } = useNotificationStore.getState();
      addNotification("error", "Failed to undo action", 4000);
    } finally {
      setProcessingUndo(null);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "error":
      case "auth-error":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getNotificationColors = (type: NotificationType) => {
    switch (type) {
      case "success":
        return {
          background:
            "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          text: "text-green-800 dark:text-green-200",
          button:
            "text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50",
        };
      case "error":
      case "auth-error":
        return {
          background:
            "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          text: "text-red-800 dark:text-red-200",
          button:
            "text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/50",
        };
      case "warning":
        return {
          background:
            "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
          icon: "text-yellow-600 dark:text-yellow-400",
          text: "text-yellow-800 dark:text-yellow-200",
          button:
            "text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/50",
        };
      case "info":
      default:
        return {
          background:
            "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          text: "text-blue-800 dark:text-blue-200",
          button:
            "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50",
        };
    }
  };

  const visibleNotifications = notifications.filter((n) => n.visible);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => {
          const colors = getNotificationColors(notification.type);
          const isProcessing = processingUndo === notification.id;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={`mb-3 pointer-events-auto`}
            >
              <div
                className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm ${colors.background}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${colors.icon}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${colors.text}`}>
                      {notification.message}
                    </p>

                    {/* Undo button below message - more prominent */}
                    {notification.undoAction && (
                      <div className="mt-2">
                        <button
                          onClick={() =>
                            handleUndo(
                              notification.undoAction!,
                              notification.id
                            )
                          }
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            isProcessing
                              ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              : `border-current ${colors.button} ${
                                  colors.background.includes("green")
                                    ? "bg-green-100 dark:bg-green-800/30"
                                    : colors.background.includes("red")
                                    ? "bg-red-100 dark:bg-red-800/30"
                                    : colors.background.includes("yellow")
                                    ? "bg-yellow-100 dark:bg-yellow-800/30"
                                    : "bg-blue-100 dark:bg-blue-800/30"
                                }`
                          }`}
                          title={
                            isProcessing
                              ? "Undoing..."
                              : notification.undoAction.label
                          }
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                              Undoing...
                            </>
                          ) : (
                            <>
                              <ArrowUturnLeftIcon className="w-3 h-3" />
                              {notification.undoAction.label}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Close button - smaller and less prominent */}
                  <div className="flex-shrink-0 ml-2">
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className={`rounded-md p-1 inline-flex ${colors.icon} opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current transition-opacity`}
                      title="Close notification"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GlobalNotifications;
