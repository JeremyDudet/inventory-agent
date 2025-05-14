import { useState, useEffect } from "react";
// import { useItemContext } from "@/context/ItemContext";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
// import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { api } from "@/services/api";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
// import { useNotification } from "@/context/NotificationContext";

// import { useSession } from "next-auth/react";

// import { Item, InventoryCount, User, Unit } from "@prisma/client";

// type ItemWithInventoryCounts = Item & {
//   inventoryCounts: InventoryCount[];
// };

// type Props = {
//   item: ItemWithInventoryCounts;
//   users: User[];
//   units: Unit[];
//   children: React.ReactNode;
//   onUpdate: () => void;
// };

interface InputCountDrawerProps {
  item: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  };
  location_id: string;
  children: React.ReactNode;
  onUpdate?: () => void;
}

export function InputCountDrawer({
  item,
  location_id,
  children,
  onUpdate,
}: InputCountDrawerProps) {
  // const { items, setItems } = useItemContext();
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // const { data: session } = useSession();
  // const userId = session?.user?.id;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newCount, setNewCount] = useState(item.quantity);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const { session } = useAuthStore();
  const { theme } = useThemeStore();
  // const { addNotification, showApiError } = useNotification();

  // const hasInventoryCounts = item.inventoryCounts?.length > 0;
  // const [newCount, setNewCount] = useState(
  //   hasInventoryCounts
  //     ? item.inventoryCounts[item.inventoryCounts.length - 1].count
  //     : 0
  // );
  let latestCount = null;
  let latestCountUserId: any = null;
  let latestCountUserName = "Unknown User";
  // if (hasInventoryCounts) {
  //   latestCount = item.inventoryCounts[item.inventoryCounts.length - 1];
  //   latestCountUserId = latestCount.userId;
  //   latestCountUserName =
  //     users.find((user: any) => user.id === latestCountUserId)?.firstName ||
  //     "Unknown User";
  // }
  const getRelativeTime = (updatedAt: Date) => {
    const now = new Date().getTime();
    const diffTime = Math.abs(now - updatedAt.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffHours === 1) {
      return `1 hour ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return `1 day ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  function onClick(adjustment: number) {
    setNewCount(Math.max(0, Math.min(9999, newCount + adjustment)));
  }

  // const inventoryCountData = item.inventoryCounts?.map((count) => ({
  //   date: new Date(count.updatedAt).toLocaleDateString("en-US", {
  //     month: "2-digit",
  //     day: "2-digit",
  //   }),
  //   count: count.count,
  // }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => {
      clearInterval(timer);
    };
  }, []);

  const submitNewCount = async () => {
    if (!newCount || newCount < 0) {
      setError("Please enter a valid quantity");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = session?.access_token;
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Send only quantity
      await api.updateInventory(
        item.id,
        { quantity: newCount }, // Remove location_id
        token
      );

      setIsOpen(false);
      onUpdate?.();
    } catch (err) {
      console.error("Error updating inventory:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  const getFontSize = (count: number) => {
    const digits = count.toString().length;
    if (digits <= 2) return "3.75rem"; // 60px
    if (digits === 3) return "3rem"; // 48px
    if (digits === 4) return "2.5rem"; // 40px
    return "2rem"; // 32px for 5+ digits
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger
        onClick={() => setIsOpen(!isOpen)}
        asChild
        className="sm:hidden"
      >
        {children}
      </DrawerTrigger>
      <DrawerOverlay
        onClick={() => setIsOpen(false)}
        className="bg-transparent h-full"
      />
      <DrawerContent className="flex flex-col items-center justify-center py-6 px-4 max-w-lg mx-auto bg-white dark:bg-zinc-900">
        <DrawerHeader className="w-full text-center">
          <DrawerTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {item.name}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Last updated {getRelativeTime(new Date())} by{" "}
            <span className="font-bold">{"Unknown"}</span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex items-center justify-center space-x-8 my-8 w-full">
          <button
            type="button"
            className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl cursor-pointer ${
              newCount <= 0
                ? "bg-zinc-400 dark:bg-zinc-700 text-white dark:text-zinc-200"
                : "bg-zinc-500 dark:bg-zinc-700 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-600"
            }`}
            onClick={() => onClick(-1)}
            disabled={newCount <= 0}
          >
            <MinusIcon className="h-8 w-8" />
            <span className="sr-only">Decrease</span>
          </button>
          <div className="flex flex-col items-center">
            <div className="h-[80px] flex items-center justify-center">
              <input
                type="number"
                inputMode="decimal"
                pattern="^(\\d+(\\.\\d+)?|\\.\\d+)$"
                min={0}
                max={9999}
                value={newCount}
                onChange={(e) => {
                  if (e.target.value === "00") {
                    setNewCount(0);
                  } else {
                    const value = parseFloat(e.target.value);
                    setNewCount(Math.min(9999, Math.max(0, value)));
                  }
                }}
                className="font-bold tracking-tighter leading-none text-center w-[120px] bg-transparent outline-none border-none focus:ring-0 text-zinc-900 dark:text-zinc-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{
                  MozAppearance: "textfield",
                  fontSize: getFontSize(newCount),
                  lineHeight: 1,
                }}
              />
            </div>
            <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400 tracking-widest mt-2">
              {item.unit}
            </span>
          </div>
          <button
            type="button"
            className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl cursor-pointer ${
              newCount >= 9999
                ? "bg-zinc-400 dark:bg-zinc-700 text-white dark:text-zinc-200"
                : "bg-zinc-500 dark:bg-zinc-700 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-600"
            }`}
            onClick={() => onClick(1)}
            disabled={newCount >= 9999}
          >
            <PlusIcon className="h-8 w-8" />
            <span className="sr-only">Increase</span>
          </button>
        </div>
        <DrawerFooter className="w-full flex flex-row justify-end gap-2 mt-4">
          <div className="w-full flex flex-row justify-center gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl max-w-40 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={submitNewCount}
              className={`rounded-xl w-full max-w-40 px-6 py-3 cursor-pointer ${
                submitting
                  ? "bg-zinc-400 dark:bg-zinc-700 text-white dark:text-zinc-200"
                  : "bg-zinc-500 dark:bg-zinc-700 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-600"
              }`}
              disabled={submitting}
            >
              <span
                className="flex justify-center items-center gap-2"
                style={{ gap: 8 }}
              >
                Update
              </span>
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
