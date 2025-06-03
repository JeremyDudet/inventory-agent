import React, { useState, useEffect, useRef } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";
import { useFilterStore } from "@/stores/filterStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useChangelogStore } from "@/stores/changelogStore";
import { useUndoStore } from "@/stores/undoStore";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverPanel,
  PopoverGroup,
} from "@headlessui/react";
import {
  ChevronDownIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/20/solid";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { motion } from "framer-motion";

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
  const [filteredUpdates, setFilteredUpdates] = useState<InventoryUpdate[]>([]);
  const [processingUndo, setProcessingUndo] = useState<string | null>(null);
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
  const { actionHistory, executeUndo } = useUndoStore();
  const {
    updates,
    users,
    isLoading,
    lastFetchTime,
    hasInitiallyLoaded,
    setUpdates,
    setUsers,
    setIsLoading,
    setLastFetchTime,
    updateItemNames,
    forceRefresh,
  } = useChangelogStore();

  const actions = ["add", "remove", "set", "check"] as const;

  useEffect(() => {
    // Only fetch if we haven't loaded data yet
    if (!hasInitiallyLoaded) {
      fetchUpdates();
    }
  }, [hasInitiallyLoaded]);

  // Update item names when items change
  useEffect(() => {
    if (updates.length > 0 && items.length > 0) {
      updateItemNames(items);
    }
  }, [items, updates.length, updateItemNames]);

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
      setUsers(uniqueUsers);
      setLastFetchTime(new Date());
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
      const startDate = new Date(dateRange.start + "T00:00:00");
      filtered = filtered.filter(
        (update) => new Date(update.createdAt) >= startDate
      );
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end + "T23:59:59.999");
      filtered = filtered.filter(
        (update) => new Date(update.createdAt) <= endDate
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

  const handleRefresh = () => {
    forceRefresh();
  };

  // Check if an update can be undone
  const canUndoUpdate = (update: InventoryUpdate) => {
    // Only allow undo for inventory updates from the current user
    const currentUserId = session?.user?.id;
    if (update.userId !== currentUserId) return null;

    // Look for matching undoable action in the undo store
    // Match by itemId and within a reasonable time window (5 minutes to account for processing delays)
    const updateTime = new Date(update.createdAt).getTime();
    const matchingAction = actionHistory.find((action) => {
      const actionTime = action.timestamp.getTime();
      const timeDiff = Math.abs(updateTime - actionTime);

      return (
        action.itemId === update.itemId &&
        action.type === "inventory_update" &&
        timeDiff < 300000 && // Within 5 minutes (more forgiving)
        // Additional check: quantities should match
        action.currentState?.quantity === update.newQuantity &&
        action.previousState?.quantity === update.previousQuantity
      );
    });

    return matchingAction;
  };

  const handleUndo = async (update: InventoryUpdate) => {
    const undoableAction = canUndoUpdate(update);
    if (!undoableAction) return;

    setProcessingUndo(update.id);

    try {
      const success = await executeUndo(undoableAction.id);

      if (success) {
        addNotification("success", "Action undone successfully", 3000);
        // Refresh the changelog to show the reverted state
        forceRefresh();
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

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-inherit max-w-7xl">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <Heading level={1}>Change Log</Heading>
          <Text>Track all changes made to your inventory.</Text>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center gap-4">
          {lastFetchTime && (
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Last updated: {lastFetchTime.toLocaleTimeString()}
            </Text>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-zinc-300 dark:border-zinc-600 shadow-sm text-sm leading-4 font-medium rounded-md text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`-ml-0.5 mr-2 h-4 w-4 ${
                isLoading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col gap-2 mt-12 w-full justify-center">
        <div className="flex gap-2">
          <SearchBar value={searchQuery} onChange={setChangeLogSearchQuery} />

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300 sm:hidden"
          >
            Filters
            {(selectedActions.length > 0 || selectedUsers.length > 0) && (
              <span className="ml-1.5 flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                {selectedActions.length + selectedUsers.length}
              </span>
            )}
          </button>

          {/* Desktop filter buttons */}
          <div className="hidden sm:flex gap-2">
            <FilterButton
              label="Actions"
              selectedCount={selectedActions.length}
              options={actions}
              selectedOptions={selectedActions}
              onToggle={handleActionToggle}
            />
            <FilterButton
              label="Users"
              selectedCount={selectedUsers.length}
              options={users}
              selectedOptions={selectedUsers}
              onToggle={handleUserToggle}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="hidden sm:flex gap-2 justify-end">
          <div className="flex flex-col">
            <label
              htmlFor="date-start"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Start Date
            </label>
            <Input
              id="date-start"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setChangeLogDateRange({ ...dateRange, start: e.target.value })
              }
              className="w-40 max-w-48"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="date-end"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              End Date
            </label>
            <Input
              id="date-end"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setChangeLogDateRange({ ...dateRange, end: e.target.value })
              }
              className="w-40 max-w-48"
            />
          </div>
        </div>

        {/* Active filters */}
        <div className="bg-inherit mt-2">
          <div className="max-w-7xl sm:flex sm:items-center sm:px-6 lg:px-8">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ActiveFilters:
              <span className="sr-only">, active</span>
            </h3>

            <div
              aria-hidden="true"
              className="hidden h-5 w-px bg-zinc-500 dark:bg-zinc-400 sm:ml-4 sm:block"
            />

            <div className="mt-2 sm:ml-4 sm:mt-0">
              <div className="-m-1 flex flex-wrap items-center">
                {selectedActions.map((action) => (
                  <span
                    key={action}
                    className="m-1 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 py-1.5 pl-3 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-200"
                  >
                    <span className="capitalize">{action}</span>
                    <button
                      type="button"
                      onClick={() => handleActionToggle(action)}
                      className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400"
                    >
                      <span className="sr-only">
                        Remove filter for {action}
                      </span>
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 8 8"
                        className="size-2"
                      >
                        <path
                          d="M1 1l6 6m0-6L1 7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
                {selectedUsers.map((user) => (
                  <span
                    key={user}
                    className="m-1 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 py-1.5 pl-3 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-200"
                  >
                    <span>{user}</span>
                    <button
                      type="button"
                      onClick={() => handleUserToggle(user)}
                      className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400"
                    >
                      <span className="sr-only">Remove filter for {user}</span>
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 8 8"
                        className="size-2"
                      >
                        <path
                          d="M1 1l6 6m0-6L1 7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
                {dateRange.start && (
                  <span className="m-1 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 py-1.5 pl-3 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    <span>
                      From:{" "}
                      {new Date(
                        dateRange.start + "T00:00:00"
                      ).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setChangeLogDateRange({ ...dateRange, start: "" })
                      }
                      className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400"
                    >
                      <span className="sr-only">Remove start date filter</span>
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 8 8"
                        className="size-2"
                      >
                        <path
                          d="M1 1l6 6m0-6L1 7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                {dateRange.end && (
                  <span className="m-1 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 py-1.5 pl-3 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-200">
                    <span>
                      To:{" "}
                      {new Date(
                        dateRange.end + "T00:00:00"
                      ).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setChangeLogDateRange({ ...dateRange, end: "" })
                      }
                      className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400"
                    >
                      <span className="sr-only">Remove end date filter</span>
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 8 8"
                        className="size-2"
                      >
                        <path
                          d="M1 1l6 6m0-6L1 7"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        setOpen={setMobileFiltersOpen}
        actions={actions}
        users={users}
        selectedActions={selectedActions}
        selectedUsers={selectedUsers}
        onActionToggle={handleActionToggle}
        onUserToggle={handleUserToggle}
        dateRange={dateRange}
        setDateRange={setChangeLogDateRange}
      />

      {/* Table */}
      <div className="-mx-4 mt-12 sm:-mx-0">
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
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:pl-0">
                  Item
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  Action
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  Change
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 md:table-cell">
                  User
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 lg:table-cell">
                  Method
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 md:table-cell">
                  Date
                </th>
                <th
                  className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400"
                  title="Undo actions you performed (highlighted in blue)"
                >
                  <span className="sr-only sm:not-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-inherit">
              {filteredUpdates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {isLoading ? "Loading..." : "No inventory updates found"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUpdates.map((update) => {
                  const undoableAction = canUndoUpdate(update);
                  const isProcessingThisUndo = processingUndo === update.id;
                  const isCurrentUserAction =
                    update.userId === session?.user?.id;

                  return (
                    <tr
                      key={update.id}
                      className={`transition-all duration-700 ease-in-out ${
                        update.isNew ? "bg-green-50 dark:bg-green-900/20" : ""
                      }`}
                    >
                      <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:w-auto sm:max-w-none sm:pl-0">
                        {update.itemName}
                        <dl className="font-normal sm:hidden">
                          <dt className="sr-only">Action</dt>
                          <dd className="mt-1 truncate">
                            <span
                              className={`capitalize ${getActionColor(
                                update.action
                              )}`}
                            >
                              {update.action}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                              {update.previousQuantity} → {update.newQuantity}{" "}
                              {update.unit}
                            </span>
                          </dd>
                          <dt className="sr-only md:hidden">User and Date</dt>
                          <dd className="mt-1 truncate text-zinc-500 dark:text-zinc-400 md:hidden">
                            {update.userName} • {formatDate(update.createdAt)}
                          </dd>
                          <dt className="sr-only lg:hidden">Method</dt>
                          <dd className="mt-1 truncate lg:hidden">
                            {getMethodDisplay(update.method)}
                          </dd>
                        </dl>
                      </td>
                      <td className="hidden px-3 py-4 text-sm sm:table-cell">
                        <span
                          className={`capitalize ${getActionColor(
                            update.action
                          )}`}
                        >
                          {update.action}
                        </span>
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                        {update.previousQuantity} → {update.newQuantity}{" "}
                        {update.unit}
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                        {update.userName}
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 lg:table-cell">
                        {getMethodDisplay(update.method)}
                      </td>
                      <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                        {formatDate(update.createdAt)}
                      </td>
                      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 whitespace-nowrap">
                        {undoableAction ? (
                          <button
                            onClick={() => handleUndo(update)}
                            disabled={isProcessingThisUndo}
                            className={`inline-flex items-center gap-1 p-1.5 rounded-md transition-colors ${
                              isProcessingThisUndo
                                ? "opacity-50 cursor-not-allowed text-zinc-400 dark:text-zinc-500"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            }`}
                            title={
                              isProcessingThisUndo
                                ? "Undoing..."
                                : "Undo this action"
                            }
                          >
                            {isProcessingThisUndo ? (
                              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <ArrowUturnLeftIcon className="w-4 h-4" />
                            )}
                            <span className="sr-only">
                              {isProcessingThisUndo
                                ? "Undoing..."
                                : "Undo this action"}
                            </span>
                          </button>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full">
      <Input
        id="search"
        name="search"
        type="search"
        placeholder="Search items or users..."
        aria-label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function MobileFilterDrawer({
  open,
  setOpen,
  actions,
  users,
  selectedActions,
  selectedUsers,
  onActionToggle,
  onUserToggle,
  dateRange,
  setDateRange,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  actions: readonly string[];
  users: string[];
  selectedActions: string[];
  selectedUsers: string[];
  onActionToggle: (action: string) => void;
  onUserToggle: (user: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
}) {
  return (
    <Dialog open={open} onClose={setOpen} className="relative z-40 sm:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 z-40 flex">
        <DialogPanel
          transition
          className="relative ml-auto flex size-full max-w-xs max-h-screen outline outline-zinc-200 dark:outline-zinc-700 transform flex-col overflow-y-auto bg-white dark:bg-zinc-900 py-4 pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:translate-x-full"
        >
          <div className="flex items-center justify-between px-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 flex size-10 items-center justify-center rounded-md bg-inherit p-2 text-zinc-400"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>

          {/* Filters */}
          <form className="mt-4">
            {/* Actions Filter */}
            <Disclosure
              as="div"
              className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-6"
            >
              <h3 className="-mx-2 -my-3 flow-root">
                <DisclosureButton className="group flex w-full items-center justify-between px-2 py-3 text-sm text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Actions
                  </span>
                  <span className="ml-6 flex items-center">
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-5 rotate-0 transform group-data-[open]:-rotate-180"
                    />
                  </span>
                </DisclosureButton>
              </h3>
              <DisclosurePanel className="pt-6">
                <div className="space-y-6">
                  {actions.map((action) => (
                    <div key={action} className="flex gap-3">
                      <div className="flex h-5 shrink-0 items-center">
                        <div className="group grid size-4 grid-cols-1">
                          <input
                            checked={selectedActions.includes(action)}
                            onChange={() => onActionToggle(action)}
                            id={`filter-mobile-action-${action}`}
                            name="action[]"
                            type="checkbox"
                            className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400 indeterminate:border-zinc-600 dark:indeterminate:border-zinc-400 indeterminate:bg-zinc-600 dark:indeterminate:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:focus-visible:outline-zinc-400 disabled:border-zinc-300 dark:disabled:border-zinc-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:checked:bg-zinc-100 dark:disabled:checked:bg-zinc-900 forced-colors:appearance-auto"
                          />
                          <svg
                            fill="none"
                            viewBox="0 0 14 14"
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900 group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-zinc-50/25"
                          >
                            <motion.path
                              d="M3 8L6 11L11 3.5"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{
                                pathLength: selectedActions.includes(action)
                                  ? 1
                                  : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </svg>
                        </div>
                      </div>
                      <label
                        htmlFor={`filter-mobile-action-${action}`}
                        className="text-sm text-zinc-900 dark:text-zinc-100 capitalize"
                      >
                        {action}
                      </label>
                    </div>
                  ))}
                </div>
              </DisclosurePanel>
            </Disclosure>

            {/* Users Filter */}
            <Disclosure
              as="div"
              className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-6"
            >
              <h3 className="-mx-2 -my-3 flow-root">
                <DisclosureButton className="group flex w-full items-center justify-between px-2 py-3 text-sm text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Users
                  </span>
                  <span className="ml-6 flex items-center">
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-5 rotate-0 transform group-data-[open]:-rotate-180"
                    />
                  </span>
                </DisclosureButton>
              </h3>
              <DisclosurePanel className="pt-6">
                <div className="space-y-6">
                  {users.map((user) => (
                    <div key={user} className="flex gap-3">
                      <div className="flex h-5 shrink-0 items-center">
                        <div className="group grid size-4 grid-cols-1">
                          <input
                            checked={selectedUsers.includes(user)}
                            onChange={() => onUserToggle(user)}
                            id={`filter-mobile-user-${user}`}
                            name="user[]"
                            type="checkbox"
                            className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400 indeterminate:border-zinc-600 dark:indeterminate:border-zinc-400 indeterminate:bg-zinc-600 dark:indeterminate:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:focus-visible:outline-zinc-400 disabled:border-zinc-300 dark:disabled:border-zinc-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:checked:bg-zinc-100 dark:disabled:checked:bg-zinc-900 forced-colors:appearance-auto"
                          />
                          <svg
                            fill="none"
                            viewBox="0 0 14 14"
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900 group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-zinc-50/25"
                          >
                            <motion.path
                              d="M3 8L6 11L11 3.5"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{
                                pathLength: selectedUsers.includes(user)
                                  ? 1
                                  : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </svg>
                        </div>
                      </div>
                      <label
                        htmlFor={`filter-mobile-user-${user}`}
                        className="text-sm text-zinc-900 dark:text-zinc-100"
                      >
                        {user}
                      </label>
                    </div>
                  ))}
                </div>
              </DisclosurePanel>
            </Disclosure>

            {/* Date Range Filter */}
            <Disclosure
              as="div"
              className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-6"
            >
              <h3 className="-mx-2 -my-3 flow-root">
                <DisclosureButton className="group flex w-full items-center justify-between px-2 py-3 text-sm text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Date Range
                  </span>
                  <span className="ml-6 flex items-center">
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-5 rotate-0 transform group-data-[open]:-rotate-180"
                    />
                  </span>
                </DisclosureButton>
              </h3>
              <DisclosurePanel className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="mobile-date-start"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Start Date
                    </label>
                    <Input
                      id="mobile-date-start"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mobile-date-end"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      End Date
                    </label>
                    <Input
                      id="mobile-date-end"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                    />
                  </div>
                </div>
              </DisclosurePanel>
            </Disclosure>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function FilterButton({
  label,
  selectedCount,
  options,
  selectedOptions,
  onToggle,
}: {
  label: string;
  selectedCount: number;
  options: readonly string[] | string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <Popover className="relative inline-block text-left">
      <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700">
        <span>{label}</span>
        {selectedCount > 0 && (
          <span className="ml-1.5 flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
            {selectedCount}
          </span>
        )}
        <ChevronDownIcon
          aria-hidden="true"
          className="-mr-1 ml-1 size-5 shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400"
        />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white dark:bg-zinc-800 p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <form className="space-y-4">
          {options.map((option) => (
            <div key={option} className="flex items-center gap-3">
              <div className="flex h-5 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    checked={selectedOptions.includes(option)}
                    onChange={() => onToggle(option)}
                    id={`filter-${label}-${option}`}
                    name={`${label}[]`}
                    type="checkbox"
                    className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400 indeterminate:border-zinc-600 dark:indeterminate:border-zinc-400 indeterminate:bg-zinc-600 dark:indeterminate:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:focus-visible:outline-zinc-400 disabled:border-zinc-300 dark:disabled:border-zinc-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:checked:bg-zinc-100 dark:disabled:checked:bg-zinc-900 forced-colors:appearance-auto"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900 group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-zinc-50/25"
                  >
                    <motion.path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: selectedOptions.includes(option) ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </svg>
                </div>
              </div>
              <label
                htmlFor={`filter-${label}-${option}`}
                className="flex items-center whitespace-nowrap pr-6 text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize"
              >
                {option}
              </label>
            </div>
          ))}
        </form>
      </PopoverPanel>
    </Popover>
  );
}
