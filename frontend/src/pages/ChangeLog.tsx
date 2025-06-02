import React, { useState, useEffect, useRef } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";
import { useFilterStore } from "@/stores/filterStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  PopoverGroup,
} from "@headlessui/react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useInventorySocket } from "@/hooks/useInventorySocket";

interface InventoryUpdate {
  id: string;
  itemId: string;
  action: "add" | "remove" | "set" | "check";
  previousQuantity: number;
  newQuantity: number;
  quantity: number;
  unit: string;
  userId: string;
  userName: string;
  method?: "ui" | "voice" | "api";
  createdAt: string;
  itemName?: string;
  isNew?: boolean;
}

interface DatabaseInventoryUpdate {
  id: string;
  item_id: string;
  action: "add" | "remove" | "set" | "check";
  previous_quantity: number;
  new_quantity: number;
  quantity: number;
  unit: string;
  user_id: string;
  user_name: string;
  method?: "ui" | "voice" | "api";
  created_at: string;
}

export default function ChangeLog() {
  const [updates, setUpdates] = useState<InventoryUpdate[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<InventoryUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const isInitialLoad = useRef(true);
  const {
    changeLog: { searchQuery, dateRange, selectedUsers, selectedActions },
    setChangeLogSearchQuery,
    setChangeLogDateRange,
    setChangeLogSelectedUsers,
    setChangeLogSelectedActions,
  } = useFilterStore();
  const { session } = useAuthStore();
  const { items } = useInventoryStore();
  const { addNotification } = useNotificationStore();

  const actions = ["add", "remove", "set", "check"] as const;
  const [users, setUsers] = useState<string[]>([]);

  // Listen for live inventory updates
  useInventorySocket({
    onConnect: () => {
      console.log("ChangeLog: Connected to inventory updates");
    },
    onInventoryUpdate: (message) => {
      console.log("ChangeLog: Received inventory update", message);

      // Show notification for live updates
      if (message.data) {
        const updateData = message.data.data || message.data;
        const itemName =
          updateData.name ||
          items.find((item) => item.id === updateData.id)?.name ||
          "An item";
        addNotification(
          "info",
          `${itemName} was updated to ${updateData.quantity} ${updateData.unit}`,
          4000
        );

        // Instead of re-fetching all updates, create a new update entry
        // This represents the change that just happened
        const newUpdate: InventoryUpdate = {
          id: `update-${Date.now()}-${Math.random()}`, // Generate unique ID
          itemId: updateData.id,
          action: updateData.action || "set",
          previousQuantity: updateData.previousQuantity || 0,
          newQuantity: updateData.quantity,
          quantity: updateData.changeQuantity || updateData.quantity,
          unit: updateData.unit,
          userId: updateData.userId || session?.user?.id || "",
          userName: updateData.userName || session?.user?.email || "System",
          method: updateData.method || "ui",
          createdAt: new Date().toISOString(),
          itemName: itemName,
          isNew: true,
        };

        // Add the new update to the beginning of the list
        setUpdates((prev) => [newUpdate, ...prev]);
        setFilteredUpdates((prev) => [newUpdate, ...prev]);

        // Remove the "new" flag after animation
        setTimeout(() => {
          setUpdates((prev) =>
            prev.map((u) =>
              u.id === newUpdate.id ? { ...u, isNew: false } : u
            )
          );
          setFilteredUpdates((prev) =>
            prev.map((u) =>
              u.id === newUpdate.id ? { ...u, isNew: false } : u
            )
          );
        }, 3000);
      }
    },
  });

  useEffect(() => {
    fetchUpdates(); // Initial load - not a live update
  }, []);

  // Refetch when items change (to update item names)
  useEffect(() => {
    if (updates.length > 0) {
      // Re-enrich updates with new item names
      const enrichedUpdates = updates.map((update) => ({
        ...update,
        itemName:
          items.find((item) => item.id === update.itemId)?.name ||
          update.itemName ||
          "Unknown Item",
      }));
      setUpdates(enrichedUpdates);
    }
  }, [items]);

  const fetchUpdates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/updates/changelog`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch inventory updates");
      }

      const data = await response.json();
      const updatesData = data.updates || [];

      // Sort by created_at descending
      const sortedUpdates = [...updatesData].sort(
        (a: DatabaseInventoryUpdate, b: DatabaseInventoryUpdate) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Get unique users
      const uniqueUsers = Array.from(
        new Set(
          sortedUpdates.map(
            (update: DatabaseInventoryUpdate) => update.user_name
          )
        )
      ).filter((user): user is string => user !== null && user !== undefined);

      // Enrich updates with item names
      const enrichedUpdates = sortedUpdates.map(
        (update: DatabaseInventoryUpdate) => ({
          id: update.id,
          itemId: update.item_id,
          action: update.action,
          previousQuantity: update.previous_quantity,
          newQuantity: update.new_quantity,
          quantity: update.quantity,
          unit: update.unit,
          userId: update.user_id,
          userName: update.user_name || "System",
          method: update.method,
          createdAt: update.created_at,
          itemName:
            (update as any).item_name ||
            items.find((item) => item.id === update.item_id)?.name ||
            "Unknown Item",
          isNew: false,
        })
      );

      setUpdates(enrichedUpdates);
      setFilteredUpdates(enrichedUpdates);
      setUsers(uniqueUsers);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...updates];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (update) =>
          update.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          update.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by action
    if (selectedActions.length > 0) {
      filtered = filtered.filter((update) =>
        selectedActions.includes(update.action)
      );
    }

    // Filter by user
    if (selectedUsers.length > 0) {
      filtered = filtered.filter((update) =>
        selectedUsers.includes(update.userName)
      );
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(
        (update) => new Date(update.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (update) => new Date(update.createdAt) <= new Date(dateRange.end)
      );
    }

    setFilteredUpdates(filtered);
  }, [updates, searchQuery, selectedActions, selectedUsers, dateRange]);

  const handleActionToggle = (action: string) => {
    setChangeLogSelectedActions(
      selectedActions.includes(action)
        ? selectedActions.filter((a) => a !== action)
        : [...selectedActions, action]
    );
  };

  const handleUserToggle = (user: string) => {
    setChangeLogSelectedUsers(
      selectedUsers.includes(user)
        ? selectedUsers.filter((u) => u !== user)
        : [...selectedUsers, user]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "add":
        return "text-green-600 dark:text-green-400";
      case "remove":
        return "text-red-600 dark:text-red-400";
      case "set":
        return "text-blue-600 dark:text-blue-400";
      case "check":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-zinc-600 dark:text-zinc-400";
    }
  };

  const getMethodDisplay = (method?: string) => {
    switch (method) {
      case "voice":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/20 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Voice
          </span>
        );
      case "api":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            API
          </span>
        );
      case "ui":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-900/20 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            UI
          </span>
        );
    }
  };

  return (
    <div className="">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <Heading level={1}>Change Log</Heading>
          <Text>Track all changes made to your inventory.</Text>
        </div>
        {lastUpdateTime && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </Text>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search items or users..."
              value={searchQuery}
              onChange={(e) => setChangeLogSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setChangeLogDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setChangeLogDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>

        {/* Action and User Filters */}
        <div className="flex flex-wrap gap-4">
          <PopoverGroup className="flex items-center divide-x divide-zinc-200 dark:divide-zinc-700">
            {/* Action Filter */}
            <Popover className="relative inline-block px-4 text-left">
              <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300">
                <span>Actions</span>
                {selectedActions.length > 0 && (
                  <span className="ml-1.5 flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                    {selectedActions.length}
                  </span>
                )}
                <ChevronDownIcon className="ml-1 size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
              </PopoverButton>

              <PopoverPanel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white dark:bg-zinc-800 p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
                <div className="space-y-4">
                  {actions.map((action) => (
                    <div key={action} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action)}
                        onChange={() => handleActionToggle(action)}
                        className="rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span className="capitalize">{action}</span>
                    </div>
                  ))}
                </div>
              </PopoverPanel>
            </Popover>

            {/* User Filter */}
            <Popover className="relative inline-block px-4 text-left">
              <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300">
                <span>Users</span>
                {selectedUsers.length > 0 && (
                  <span className="ml-1.5 flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                    {selectedUsers.length}
                  </span>
                )}
                <ChevronDownIcon className="ml-1 size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
              </PopoverButton>

              <PopoverPanel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white dark:bg-zinc-800 p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user)}
                        onChange={() => handleUserToggle(user)}
                        className="rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{user}</span>
                    </div>
                  ))}
                </div>
              </PopoverPanel>
            </Popover>
          </PopoverGroup>
        </div>

        {/* Active Filters */}
        {(selectedActions.length > 0 ||
          selectedUsers.length > 0 ||
          dateRange.start ||
          dateRange.end) && (
          <div className="flex flex-wrap gap-2">
            {selectedActions.map((action) => (
              <span
                key={action}
                className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-sm"
              >
                Action: {action}
                <button
                  onClick={() => handleActionToggle(action)}
                  className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <XMarkIcon className="size-2" />
                </button>
              </span>
            ))}
            {selectedUsers.map((user) => (
              <span
                key={user}
                className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-sm"
              >
                User: {user}
                <button
                  onClick={() => handleUserToggle(user)}
                  className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <XMarkIcon className="size-2" />
                </button>
              </span>
            ))}
            {dateRange.start && (
              <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-sm">
                From: {new Date(dateRange.start).toLocaleDateString()}
                <button
                  onClick={() =>
                    setChangeLogDateRange({ ...dateRange, start: "" })
                  }
                  className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <XMarkIcon className="size-2" />
                </button>
              </span>
            )}
            {dateRange.end && (
              <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-sm">
                To: {new Date(dateRange.end).toLocaleDateString()}
                <button
                  onClick={() =>
                    setChangeLogDateRange({ ...dateRange, end: "" })
                  }
                  className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <XMarkIcon className="size-2" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Updating...
                    </span>
                  </div>
                </div>
              )}
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:pl-0">
                      Item
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Action
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Change
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      User
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Method
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredUpdates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {isLoading
                            ? "Loading..."
                            : "No inventory updates found"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUpdates.map((update) => (
                      <tr
                        key={update.id}
                        className={`transition-all duration-700 ease-in-out ${
                          update.isNew ? "bg-green-50 dark:bg-green-900/20" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:pl-0">
                          {update.itemName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`capitalize ${getActionColor(
                              update.action
                            )}`}
                          >
                            {update.action}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                          {update.previousQuantity} → {update.newQuantity}{" "}
                          {update.unit}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                          {update.userName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                          {getMethodDisplay(update.method)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                          {formatDate(update.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
