// frontend/src/pages/Items.tsx
// Purpose: Allows users to view, filter, and manually manage inventory items.
// frontend/src/pages/Dashboard.tsx
// Purpose: Provides an overview of inventory status and recent activity. Also allows for voice control of inventory.
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import InventoryGrid, { InventoryItem } from "../components/InventoryGrid";
import LoadingSpinner from "../components/LoadingSpinner";
import supabase from "../config/supabase";
import { api } from "../services/api";
import io from "socket.io-client";

const VoiceControl = lazy(() => import("../components/VoiceControl"));

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
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceMinimized, setIsVoiceMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [voiceControlKey, setVoiceControlKey] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  // Effect to watch listening state changes
  useEffect(() => {
    if (!isListening) {
      // If listening stops, increment the key to refresh the voice control component
      // on the next render when it's not minimized
      setVoiceControlKey((prev) => prev + 1);
    }
  }, [isListening]);

  const { user: authUser, signOut } = useAuth();

  useEffect(() => {
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

  const handleLogout = async () => {
    await signOut();
  };

  const toggleVoiceControl = () => {
    if (isVoiceActive) {
      // If we're recording, don't fully hide - just minimize
      if (isListening) {
        setIsVoiceMinimized(true);
      } else {
        setIsVoiceActive(false);
        setIsVoiceMinimized(false);
      }
    } else {
      // Show voice control
      setIsVoiceActive(true);
      setIsVoiceMinimized(false);
    }
  };

  const maximizeVoiceControl = () => {
    setIsVoiceActive(true);
    setIsVoiceMinimized(false);
  };

  // This function is used for the minimized "Stop listening" button
  const stopListening = () => {
    setIsListening(false);
    // We don't directly call any VoiceControl methods here
    // Instead we rely on the state change to propagate to the still-mounted VoiceControl component
  };

  const handleVoiceFailure = () => {
    setIsVoiceActive(false);
    setIsVoiceMinimized(false);
    setIsListening(false);
    addNotification("warning", "Voice recognition failed.");
  };

  const handleListeningStateChange = (
    listening: boolean,
    audioStream: MediaStream | null
  ) => {
    setIsListening(listening);
    setStream(audioStream);
  };

  const handleConnectionStateChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  const handleInventoryUpdate = async (update: {
    item: string;
    itemId?: string;
    action: string;
    quantity: number;
    unit: string;
  }) => {
    try {
      // Use the API service to send updates to the backend
      // This prevents double-processing the command (once here and once in the backend)
      const token = localStorage.getItem("token") || "";
      await api.updateInventory(
        {
          action: update.action as "add" | "remove" | "set",
          item: update.item,
          itemId: update.itemId,
          quantity: update.quantity,
          unit: update.unit,
        },
        token
      );

      // Refresh inventory after the update
      const updatedInventory = await fetchInventory();
      setInventory(updatedInventory);
      addNotification(
        "success",
        `${update.action}ed ${update.quantity} ${update.unit} of ${update.item}`
      );
    } catch (error) {
      console.error("Error updating inventory:", error);
      addNotification("error", "Failed to update inventory");
    }
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
