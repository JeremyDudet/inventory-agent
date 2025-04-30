// frontend/src/pages/Items.tsx
// Purpose: Allows users to view, filter, and manually manage inventory items.
// frontend/src/pages/Dashboard.tsx
// Purpose: Provides an overview of inventory status and recent activity. Also allows for voice control of inventory.
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import InventoryGrid, { InventoryItem } from "../components/InventoryGrid";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import supabase from "../config/supabase";
import io from "socket.io-client";

interface User {
  email: string;
  name: string;
  role: string;
}

const Items: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const { user: authUser, signOut } = useAuth();

  useEffect(() => {
    loadUserAndInventory();

    // Add WebSocket listener for real-time inventory updates
    const socket = io(
      `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/voice`,
      {
        transports: ["websocket"],
        forceNew: false,
      }
    );

    // Handle inventory updates from WebSocket
    socket.on("inventory-updated", (data: any) => {
      if (data.status === "success") {
        console.log("Received inventory update via WebSocket", data);
        // Refresh inventory to show the latest data
        fetchInventory().then((updatedInventory) => {
          setInventory(updatedInventory);
        });
      }
    });

    return () => {
      socket.off("inventory-updated");
      socket.disconnect();
    };
  }, [navigate, authUser]);

  const loadUserAndInventory = async () => {
    try {
      if (!authUser) {
        navigate("/login");
        return;
      }

      // Set user from Supabase auth
      setUser({
        email: authUser.email || "",
        name: authUser.user_metadata?.name || "User",
        role: authUser.user_metadata?.role || "staff",
      });

      const fetchedInventory = await fetchInventory();
      setInventory(fetchedInventory);
    } catch (error) {
      console.error("Error loading data:", error);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("lastupdated", { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error);
      addNotification("error", "Failed to load inventory");
      return [];
    }

    // Log the first item to see the format of lastupdated
    if (data && data.length > 0) {
      console.log("First item lastupdated:", data[0].lastupdated);
      console.log("First item full data:", data[0]);
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      threshold: item.threshold,
      lastupdated: item.lastupdated,
    }));
  };

  if (isLoading) return <LoadingSpinner fullScreen text="Loading..." />;

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <InventoryGrid
          items={inventory}
          onItemSelect={() => {}}
          filterCategory={undefined}
          searchTerm=""
        />
      </div>
    </div>
  );
};

export default Items;
