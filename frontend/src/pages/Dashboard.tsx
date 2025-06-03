// frontend/src/pages/Dashboard.tsx
// Purpose: Provides an overview of inventory status and recent activity. Also allows for voice control of inventory.
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useUndoStore } from "@/stores/undoStore";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import UndoHistory from "@/components/UndoHistory";

// Utility function for combining class names
function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const Dashboard: React.FC = () => {
  const { items, categories } = useInventoryData();
  const { error } = useInventoryStore();
  const { fetchUndoActions, hasInitiallyLoaded } = useUndoStore();

  // Fetch undo actions only if not already loaded
  useEffect(() => {
    if (!hasInitiallyLoaded) {
      fetchUndoActions();
    }
  }, [fetchUndoActions, hasInitiallyLoaded]);

  // Calculate useful stats
  const totalItems = items.length;
  const totalQuantity = items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  const lowStockItems = items.filter(
    (item) => item.threshold && item.quantity <= item.threshold
  );
  const outOfStockItems = items.filter((item) => (item.quantity || 0) === 0);

  // Calculate mock change percentages (in a real app, you'd compare with historical data)
  const getMockChange = (value: number, index: number) => {
    const changes = ["+12.5%", "+4.2%", "-8.7%", "+15.3%"];
    const changeTypes: ("positive" | "negative")[] = [
      "positive",
      "positive",
      "positive",
      "negative",
    ];
    return {
      change: changes[index] || "+0.0%",
      changeType: changeTypes[index] || "positive",
    };
  };

  // Create stats array similar to the provided example
  const stats = [
    {
      name: "Total Items",
      value: totalItems.toLocaleString(),
      ...getMockChange(totalItems, 0),
    },
    {
      name: "Total Quantity",
      value: totalQuantity.toLocaleString(),
      ...getMockChange(totalQuantity, 1),
    },
    {
      name: "Low Stock Items",
      value: lowStockItems.length.toLocaleString(),
      ...getMockChange(lowStockItems.length, 2),
    },
    {
      name: "Out of Stock",
      value: outOfStockItems.length.toLocaleString(),
      ...getMockChange(outOfStockItems.length, 3),
    },
  ];

  // Categories with item counts
  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    itemCount: items.filter((item) => item.category === category.name).length,
    totalQuantity: items
      .filter((item) => item.category === category.name)
      .reduce((sum, item) => sum + (item.quantity || 0), 0),
  }));

  // Recent updates (mock data - in real app this would come from API)
  const recentUpdates = items
    .filter((item) => item.lastupdated)
    .sort(
      (a, b) =>
        new Date(b.lastupdated).getTime() - new Date(a.lastupdated).getTime()
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-inherit max-w-7xl">
      <div className="sm:flex-auto">
        <div className="mb-8">
          <Heading level={1}>Dashboard</Heading>
          <Text>Overview of your inventory status and recent activity</Text>
        </div>

        {/* Overview Stats */}
        <dl className="mx-auto grid grid-cols-1 gap-[1px] p-[1px] bg-zinc-200 dark:bg-zinc-700 sm:grid-cols-2 lg:grid-cols-4 mt-12 rounded-xl">
          {stats.map((stat, index) => {
            // Determine rounded corners based on position in responsive grid
            const getRoundedClasses = (index: number) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isLast = index === stats.length - 1;

              // Mobile (1 column): first gets top corners, last gets bottom corners
              // Tablet (2 columns): 2x2 grid - first=top-left, second=top-right, third=bottom-left, fourth=bottom-right
              // Desktop (4 columns): first=top-left+bottom-left, last=top-right+bottom-right

              return classNames(
                // Mobile (1 column)
                isFirst && "rounded-t-xl",
                isLast && "rounded-b-xl",

                // Tablet (2 columns) - override mobile classes for 2x2 grid
                "sm:rounded-none",
                isFirst && "sm:rounded-tl-xl", // Top-left item
                isSecond && "sm:rounded-tr-xl", // Top-right item
                isThird && "sm:rounded-bl-xl", // Bottom-left item
                isLast && "sm:rounded-br-xl", // Bottom-right item

                // Desktop (4 columns) - override tablet classes for 1x4 grid
                "lg:rounded-none",
                isFirst && "lg:rounded-tl-xl lg:rounded-bl-xl", // Leftmost item
                isLast && "lg:rounded-tr-xl lg:rounded-br-xl" // Rightmost item
              );
            };

            return (
              <div
                key={stat.name}
                className={classNames(
                  "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white dark:bg-zinc-900 px-4 py-10 sm:px-6 xl:px-8",
                  getRoundedClasses(index)
                )}
              >
                <dt className="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.name}
                </dt>
                <dd
                  className={classNames(
                    stat.changeType === "negative"
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-700 dark:text-zinc-300",
                    "text-xs font-medium"
                  )}
                >
                  {stat.change}
                </dd>
                <dd className="w-full flex-none text-3xl/10 font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                  {stat.value}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Low Stock Alerts */}
          <div>
            <Heading level={2} className="mb-4">
              Low Stock Alerts
            </Heading>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-medium text-yellow-900 dark:text-yellow-100">
                          {item.name}
                        </Text>
                        <Text className="text-sm text-yellow-700 dark:text-yellow-300">
                          Current: {item.quantity} {item.unit} • Threshold:{" "}
                          {item.threshold} {item.unit}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text className="text-sm text-yellow-600 dark:text-yellow-400">
                          {item.category}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    ... and {lowStockItems.length - 5} more items
                  </Text>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg
                  className="h-12 w-12 text-green-400 dark:text-green-500 mx-auto mb-4"
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
                <Text className="text-zinc-500 dark:text-zinc-400">
                  All items are well stocked!
                </Text>
              </div>
            )}
          </div>

          {/* Categories Overview */}
          <div>
            <Heading level={2} className="mb-4">
              Categories Overview
            </Heading>
            {categoriesWithCounts.length > 0 ? (
              <div className="space-y-3">
                {categoriesWithCounts.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-medium text-zinc-950 dark:text-white">
                          {category.name}
                        </Text>
                        <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                          {category.itemCount} items •{" "}
                          {category.totalQuantity.toLocaleString()} total units
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Text className="text-zinc-500 dark:text-zinc-400">
                  No categories found
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <Heading level={2} className="mb-4">
            Recently Updated Items
          </Heading>
          {recentUpdates.length > 0 ? (
            <div className="space-y-3">
              {recentUpdates.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Text className="font-medium text-zinc-950 dark:text-white">
                        {item.name}
                      </Text>
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        {item.quantity} {item.unit} • {item.category}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(item.lastupdated).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Text className="text-zinc-500 dark:text-zinc-400">
                No recent updates
              </Text>
            </div>
          )}
        </div>

        {/* Undo History */}
        <div className="mt-12">
          <UndoHistory />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
