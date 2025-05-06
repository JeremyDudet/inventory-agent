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

// import { useToast } from "@/components/ui/use-toast";
// import apiClient from "@/lib/api";
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

export function InputCountDrawer({ children }: { children: React.ReactNode }) {
  // const { items, setItems } = useItemContext();
  // const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // const { data: session } = useSession();
  // const userId = session?.user?.id;
  const [currentTime, setCurrentTime] = useState(new Date());
  const hasInventoryCounts = false;
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

  // function onClick(adjustment: number) {
  //   setNewCount(Math.max(0, Math.min(99.9, newCount + adjustment)));
  // }

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

  // const submitNewCount = async () => {
  //   try {
  //     setSubmitting(true); // Set submitting to true before making the request
  //     console.log("Submitting count: ", newCount);
  //     const response = await apiClient.post("/inventoryCounts", {
  //       count: newCount,
  //       itemId: item.id,
  //       userId: userId,
  //     });

  //     console.log("Count submitted successfully: ", response);
  //     // Update the items state in the context
  //     const updatedItems = items.map((i) => {
  //       if (i.id === item.id) {
  //         const updatedInventoryCounts = i.inventoryCounts.map((count) => {
  //           if (count.id === response.data.id) {
  //             // If the count ID matches the response data ID, replace the count
  //             return response.data;
  //           }
  //           return count;
  //         });

  //         if (
  //           !updatedInventoryCounts.find(
  //             (count) => count.id === response.data.id
  //           )
  //         ) {
  //           // If the count doesn't exist in the array, append the new count
  //           updatedInventoryCounts.push(response.data);
  //         }

  //         return {
  //           ...i,
  //           inventoryCounts: updatedInventoryCounts,
  //         };
  //       }
  //       return i;
  //     });
  //     setItems(updatedItems);
  //     toast({
  //       title: "Success! 🎉",
  //       description: (
  //         <pre className="whitespace-pre-wrap">
  //           New count for {item.name} has been submitted.
  //         </pre>
  //       ),
  //     });
  //     setIsOpen(false);
  //     onUpdate();
  //   } catch (error) {
  //     console.error("Failed to submit count: ", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to submit the new count.",
  //     });
  //     setIsOpen(false);
  //   } finally {
  //     setSubmitting(false); // Set submitting back to false after the request is completed
  //   }
  // };

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
        <div className="w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Item Name</DrawerTitle>
            {hasInventoryCounts && (
              <DrawerDescription>
                Last updated{" "}
                {/* {latestCount ? (
                  <>{getRelativeTime(new Date(latestCount.updatedAt))}</>
                ) : (
                  "N/A"
                )}{" "} */}
                by <strong>{latestCountUserName}</strong>
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="p-4 pb-0flex ">
            <div className="flex items-center justify-between space-x-2 px-4">
              <Button
                // variant="outline"
                // size="icon"
                className="h-12 w-12 shrink-0 rounded-full"
                // onClick={() => onClick(-1)}
                // disabled={newCount <= 0}
              >
                <MinusIcon className="h-7 w-7" />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex flex-col gap-3 justify-center items-center mb-3">
                <Input
                  type="number"
                  inputMode="decimal"
                  // value={newCount}
                  className="text-7xl font-bold tracking-tighter h-fit w-[160px] text-center"
                  pattern="^(\d+(\.\d+)?|\.\d+)$"
                  // onChange={(e) => {
                  //   if (e.target.value === "00") {
                  //     setNewCount(0);
                  //   } else {
                  //     setNewCount(parseFloat(e.target.value));
                  //   }
                  // }}
                />
              </div>
              <Button
                className="h-12 w-12 shrink-0 rounded-full"
                // onClick={() => onClick(1)}
                // disabled={newCount >= 400}
              >
                <PlusIcon className="h-7 w-7" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className="text-[0.9rem] uppercase text-muted-foreground w-full flex justify-center">
              {/* {units.find((unit) => unit.id === item.unitOfMeasureId)?.name} */}
            </div>
            {/* {inventoryCountData?.length > 0 && (
              <div className="mt-3 h-[120px] ml-[-30px]">
                {/* <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryCountData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Bar
                      dataKey="count"
                      style={
                        {
                          fill: "hsl(var(--foreground))",
                          opacity: 0.9,
                        } as React.CSSProperties
                      }
                    />
                  </BarChart>
                </ResponsiveContainer> 
              </div>
            )} */}
          </div>
          <DrawerFooter className="w-full">
            <DrawerClose asChild>
              <Button onClick={() => setIsOpen(false)}>Cancel</Button>
            </DrawerClose>
            <Button onClick={() => {}} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
