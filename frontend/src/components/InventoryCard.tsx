// frontend/src/components/InventoryCard.tsx
import React from "react";

interface InventoryItemProps {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  threshold?: number;
  lastupdated: string;
  onSelect: (id: string) => void;
}

/**
 * InventoryCard component displays individual inventory items in a card format
 * following the DaisyUI and Tailwind CSS guidelines
 */
const InventoryCard: React.FC<InventoryItemProps> = ({
  id,
  name,
  quantity,
  unit,
  category,
  threshold = 0,
  lastupdated,
  onSelect,
}) => {
  // Determine status based on quantity and threshold
  const getStatus = () => {
    if (threshold === 0) return "normal";
    if (quantity <= threshold * 0.25) return "critical";
    if (quantity <= threshold * 0.5) return "low";
    return "normal";
  };

  const status = getStatus();

  // Map status to appropriate DaisyUI classes
  const getStatusClasses = () => {
    switch (status) {
      case "critical":
        return "badge badge-error";
      case "low":
        return "badge badge-warning";
      default:
        return "badge badge-success";
    }
  };

  // Format date with error handling
  const formatDate = (dateString: string): string => {
    try {
      // Try to parse the date
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      // Format date without seconds
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Unknown date";
    }
  };

  return (
    <div
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelect(id)}
    >
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h2 className="card-title text-primary">{name}</h2>
          <span className={getStatusClasses()} style={{ whiteSpace: "nowrap" }}>
            {status === "normal"
              ? "In Stock"
              : status === "low"
              ? "Low Stock"
              : "Critical"}
          </span>
        </div>

        <div className="mt-2">
          <p className="text-lg font-semibold">
            {quantity} {unit}
          </p>
          <p className="text-sm text-base-content/70">Category: {category}</p>
          {threshold > 0 && (
            <p className="text-sm text-base-content/70">
              Threshold: {threshold} {unit}
            </p>
          )}
        </div>

        <div className="card-actions justify-between items-center mt-4">
          <span className="text-xs text-base-content/50">
            Last updated:{" "}
            {lastupdated ? formatDate(lastupdated) : "Not updated yet"}
          </span>
          <button className="btn btn-sm btn-outline btn-primary">Update</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;
