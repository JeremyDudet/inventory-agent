import { useEffect } from "react";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAuthStore } from "@/stores/authStore";

export const useInventoryData = () => {
  const { user } = useAuthStore();
  const {
    items,
    categories,
    hasInitiallyLoaded,
    isLoading,
    setItems,
    setCategories,
    setIsLoading,
  } = useInventoryStore();

  useEffect(() => {
    // Only fetch if authenticated and data hasn't been loaded
    if (user && !hasInitiallyLoaded && !isLoading) {
      const fetchData = async () => {
        try {
          setIsLoading(true);

          // Fetch both inventory and categories in parallel
          const [inventoryResponse, categoriesResponse] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/inventory/categories`, {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }),
          ]);

          if (!inventoryResponse.ok)
            throw new Error("Failed to fetch inventory");
          if (!categoriesResponse.ok)
            throw new Error("Failed to fetch categories");

          const [inventoryData, categoriesData] = await Promise.all([
            inventoryResponse.json(),
            categoriesResponse.json(),
          ]);

          setItems(inventoryData.items);
          setCategories(categoriesData.categories);
        } catch (error) {
          console.error("Failed to fetch inventory data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [
    user,
    hasInitiallyLoaded,
    isLoading,
    setItems,
    setCategories,
    setIsLoading,
  ]);

  return {
    items,
    categories,
    isLoading,
    hasInitiallyLoaded,
  };
};
