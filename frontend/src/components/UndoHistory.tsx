import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClockIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { useUndoStore } from "@/stores/undoStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

const UndoHistory: React.FC = () => {
  const { actionHistory, executeUndo } = useUndoStore();
  const { addNotification } = useNotificationStore();
  const [processingUndo, setProcessingUndo] = useState<string | null>(null);

  const recentActions = actionHistory.slice(0, 10); // Show last 10 actions

  const handleUndo = async (actionId: string, description: string) => {
    setProcessingUndo(actionId);

    try {
      const success = await executeUndo(actionId);

      if (success) {
        addNotification("success", "Action undone successfully", 3000);
      } else {
        addNotification("error", "Failed to undo action", 4000);
      }
    } catch (error) {
      console.error("Failed to undo action:", error);
      addNotification("error", "Failed to undo action", 4000);
    } finally {
      setProcessingUndo(null);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes === 1) return "1 minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "inventory_update":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "item_create":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "item_delete":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "bulk_update":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/20";
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "inventory_update":
        return "Update";
      case "item_create":
        return "Create";
      case "item_delete":
        return "Delete";
      case "bulk_update":
        return "Bulk";
      default:
        return "Action";
    }
  };

  if (recentActions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <Heading level={3}>Recent Actions</Heading>
        </div>
        <Text className="text-zinc-500 dark:text-zinc-400 text-center py-8">
          No recent actions to undo
        </Text>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <ClockIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        <Heading level={3}>Recent Actions</Heading>
        <span className="text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-full">
          {recentActions.length}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {recentActions.map((action) => {
            const isProcessing = processingUndo === action.id;

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(
                      action.type
                    )}`}
                  >
                    {getActionTypeLabel(action.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {action.description}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatTimeAgo(action.timestamp)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleUndo(action.id, action.description)}
                  disabled={isProcessing}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isProcessing
                      ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-500"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                      Undoing...
                    </>
                  ) : (
                    <>
                      <ArrowUturnLeftIcon className="w-3 h-3" />
                      Undo
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Actions are automatically removed after being undone or after 24 hours
        </Text>
      </div>
    </div>
  );
};

export default UndoHistory;
