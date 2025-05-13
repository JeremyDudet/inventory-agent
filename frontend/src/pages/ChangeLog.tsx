import React, { useState, useEffect } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";
import { useFilterStore } from "@/stores/filterStore";
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
import { createClient } from "@supabase/supabase-js";

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
  createdAt: string;
  itemName?: string;
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
  created_at: string;
}

export default function ChangeLog() {
  const [updates, setUpdates] = useState<InventoryUpdate[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<InventoryUpdate[]>([]);
  const {
    changeLog: { searchQuery, dateRange, selectedUsers, selectedActions },
    setChangeLogSearchQuery,
    setChangeLogDateRange,
    setChangeLogSelectedUsers,
    setChangeLogSelectedActions,
  } = useFilterStore();
  const { session } = useAuthStore();
  const { items } = useInventoryStore();

  const actions = ["add", "remove", "set", "check"] as const;
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: updatesData, error } = await supabase
        .from("inventory_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique users
      const uniqueUsers = Array.from(
        new Set(
          updatesData.map((update: DatabaseInventoryUpdate) => update.user_name)
        )
      );

      // Enrich updates with item names
      const enrichedUpdates = updatesData.map(
        (update: DatabaseInventoryUpdate) => ({
          id: update.id,
          itemId: update.item_id,
          action: update.action,
          previousQuantity: update.previous_quantity,
          newQuantity: update.new_quantity,
          quantity: update.quantity,
          unit: update.unit,
          userId: update.user_id,
          userName: update.user_name,
          createdAt: update.created_at,
          itemName:
            items.find((item) => item.id === update.item_id)?.name ||
            "Unknown Item",
        })
      );

      setUpdates(enrichedUpdates);
      setFilteredUpdates(enrichedUpdates);
      setUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching updates:", error);
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

  return (
    <div className="">
      <div className="sm:flex-auto">
        <Heading level={1}>Change Log</Heading>
        <Text>Track all changes made to your inventory.</Text>
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredUpdates.map((update) => (
                  <tr key={update.id}>
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
                      {formatDate(update.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
