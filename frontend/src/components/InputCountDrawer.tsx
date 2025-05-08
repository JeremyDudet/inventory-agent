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
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";
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
  children: React.ReactNode;
  onUpdate?: () => void;
}

export function InputCountDrawer({
  item,
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
  const updateItem = useInventoryStore((state) => state.updateItem);
  const { session } = useAuthStore();
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
    if (!session?.access_token) {
      console.error("No access token available");
      return;
    }

    try {
      setSubmitting(true);
      console.log("Submitting new count:", {
        itemId: item.id,
        newCount,
        currentQuantity: item.quantity,
        token: session.access_token ? "present" : "missing",
      });

      const response = await api.updateInventory(
        item.id,
        { quantity: newCount },
        session.access_token
      );

      console.log("API response:", response);

      // Update local state
      updateItem({
        id: item.id,
        quantity: newCount,
      });

      // Close the drawer after successful update
      setIsOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update inventory:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger onClick={() => setIsOpen(!isOpen)} asChild>
        {children}
      </DrawerTrigger>
      <DrawerOverlay
        onClick={() => setIsOpen(false)}
        className="bg-transparent h-full"
      />
      <DrawerContent className="flex flex-col items-center justify-center py-2">
        <DrawerHeader>
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>
            Current quantity: {item.quantity} {item.unit}
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between space-x-2 px-4">
            <Button
              type="button"
              className="h-12 w-12 shrink-0 rounded-full"
              onClick={() => onClick(-1)}
              disabled={newCount <= 0}
            >
              <MinusIcon className="h-7 w-7" />
              <span className="sr-only">Decrease</span>
            </Button>
            <div className="flex flex-col gap-3 justify-center items-center mb-3">
              <Input
                type="number"
                inputMode="decimal"
                value={newCount}
                className="text-7xl font-bold tracking-tighter h-fit w-[160px] text-center"
                pattern="^(\d+(\.\d+)?|\.\d+)$"
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setNewCount(Math.max(0, value));
                  }
                }}
              />
            </div>
            <Button
              type="button"
              className="h-12 w-12 shrink-0 rounded-full"
              onClick={() => onClick(1)}
              disabled={newCount >= 9999}
            >
              <PlusIcon className="h-7 w-7" />
              <span className="sr-only">Increase</span>
            </Button>
          </div>
          <div className="text-[0.9rem] uppercase text-muted-foreground w-full flex justify-center">
            {item.unit}
          </div>
        </div>
        <DrawerFooter className="w-full">
          <DrawerClose asChild>
            <Button type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DrawerClose>
          <Button onClick={submitNewCount} disabled={submitting}>
            {submitting ? "Updating..." : "Update Count"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
