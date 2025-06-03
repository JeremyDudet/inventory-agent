// frontend/src/pages/Dashboard.tsx
// Purpose: Provides an overview of inventory status and recent activity. Also allows for voice control of inventory.
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUndoStore } from "@/stores/undoStore";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import UndoHistory from "@/components/UndoHistory";

const Dashboard: React.FC = () => {
  const { addNotification, addUndoableNotification } = useNotificationStore();
  const { addUndoableAction } = useUndoStore();

  const testNotifications = [
    {
      type: "success" as const,
      title: "Success",
      message: "Item successfully updated!",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      type: "error" as const,
      title: "Error",
      message: "Failed to update inventory item",
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      type: "warning" as const,
      title: "Warning",
      message: "Low stock alert for this item",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      type: "info" as const,
      title: "Info",
      message: "New inventory update received",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      type: "auth-error" as const,
      title: "Auth Error",
      message: "Session expired. Please log in again",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const handleTestNotification = (type: any, message: string) => {
    addNotification(type, message, 5000);
  };

  const handleTestUndoableAction = () => {
    // Simulate an inventory update that can be undone
    const mockItem = {
      id: "test-item-" + Date.now(),
      name: "Test Apples",
      quantity: 25,
      unit: "units",
    };

    // Create a mock undo function
    const createMockUndoFunction = () => async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(
        "Mock undo executed: Reverted Test Apples to previous quantity"
      );
    };

    // Add to undo history
    addUndoableAction({
      id: `test-action-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      type: "inventory_update",
      timestamp: new Date(),
      description: `Updated ${mockItem.name} from 15 to ${mockItem.quantity} ${mockItem.unit}`,
      previousState: { ...mockItem, quantity: 15 },
      currentState: mockItem,
      revertFunction: createMockUndoFunction(),
      itemId: mockItem.id,
      itemName: mockItem.name,
    });

    // Show undoable notification
    addUndoableNotification(
      "success",
      `${mockItem.name} updated from 15 to ${mockItem.quantity} ${mockItem.unit}`,
      {
        label: "Undo",
        action: createMockUndoFunction(),
        actionId: `test-action-${Date.now()}`,
      },
      8000
    );
  };

  return (
    <div className="py-6 max-w-6xl">
      <div className="mb-8">
        <Heading level={1}>Dashboard</Heading>
        <Text>Welcome to your inventory management dashboard</Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notification System Demo */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <Heading level={2} className="mb-4">
            Notification System Demo
          </Heading>
          <Text className="mb-6">
            Test the global notification system that displays messages across
            the entire application. Notifications appear in the top-right corner
            and auto-dismiss after a few seconds.
          </Text>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {testNotifications.map((notification) => (
              <button
                key={notification.type}
                onClick={() =>
                  handleTestNotification(
                    notification.type,
                    notification.message
                  )
                }
                className={`${notification.color} text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm`}
              >
                {notification.title}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              <strong>Note:</strong> The notification system is now active
              across all pages. You'll see notifications when updating inventory
              items, logging in, or performing other actions. The system
              supports success, error, warning, info, and auth-error
              notification types.
            </Text>
          </div>
        </div>

        {/* Undo System Demo */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <Heading level={2} className="mb-4">
            Undo System Demo
          </Heading>
          <Text className="mb-6">
            Test the new undo functionality that helps users correct mistakes
            from voice commands or AI misinterpretations. Undoable actions show
            an "Undo" button in notifications.
          </Text>

          <button
            onClick={handleTestUndoableAction}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 mb-4"
          >
            Test Undoable Action
          </button>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              <strong>How it works:</strong> When you perform actions
              (especially via voice/AI), you'll see notifications with "Undo"
              buttons. Actions are also saved to the history below, so you can
              undo them even after notifications disappear.
            </Text>
          </div>
        </div>
      </div>

      {/* Undo History */}
      <div className="mt-8">
        <UndoHistory />
      </div>

      {/* Future Dashboard Content */}
      <div className="mt-8 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
        <Heading level={2} className="mb-4">
          Inventory Overview
        </Heading>
        <Text className="text-zinc-600 dark:text-zinc-400">
          Dashboard content coming soon - inventory stats, recent activity,
          quick actions, etc.
        </Text>
      </div>
    </div>
  );
};

export default Dashboard;
