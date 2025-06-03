import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useInventoryStore } from "../stores/inventoryStore";
import {
  DocumentArrowUpIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ParsedData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

interface FieldMapping {
  [key: string]: number | null; // field name -> column index
}

const REQUIRED_FIELDS = [
  {
    key: "name",
    label: "Product Name",
    required: true,
    description:
      "The unique name or title of your inventory item. This will be used to identify and match existing items.",
  },
  {
    key: "quantity",
    label: "Quantity",
    required: true,
    description:
      "Current stock quantity as a number (e.g., 50, 125.5). No units - just the numeric value.",
  },
  {
    key: "unit",
    label: "Unit",
    required: true,
    description:
      "Unit of measurement (e.g., pieces, kg, liters, boxes). Keep consistent across similar items.",
  },
  {
    key: "category",
    label: "Category",
    required: true,
    description:
      "Product category for organization and filtering (e.g., Electronics, Food, Office Supplies).",
  },
];

const OPTIONAL_FIELDS = [
  {
    key: "threshold",
    label: "Low Stock Threshold",
    required: false,
    description:
      "Minimum quantity before item is considered low stock. Leave empty if not needed.",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    description:
      "Additional details about the item (color, model, notes). Helps distinguish similar products.",
  },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<
    "upload" | "mapping" | "preview" | "importing"
  >("upload");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [mappedItems, setMappedItems] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Import mode selection
  const [importMode, setImportMode] = useState<"add_update" | "replace_all">(
    "add_update"
  );

  // Preview controls state
  const [previewSearch, setPreviewSearch] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"first" | "random" | "all">(
    "first"
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [randomSeed, setRandomSeed] = useState<number>(Math.random());

  const { user, session } = useAuthStore();
  const { refreshInventory } = useInventoryStore();
  const navigate = useNavigate();

  // Preview filtering and pagination logic
  const itemsPerPage = 10;

  const getFilteredItems = () => {
    let filtered = mappedItems;

    // Apply search filter
    if (previewSearch.trim()) {
      const searchLower = previewSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getDisplayItems = () => {
    const filtered = getFilteredItems();

    switch (previewMode) {
      case "first":
        return filtered.slice(0, itemsPerPage);
      case "random":
        // Use seeded random sampling for consistent results
        const seededRandom = (seed: number) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };

        const shuffled = [...filtered].sort((a, b) => {
          const hashA = seededRandom(randomSeed + filtered.indexOf(a));
          const hashB = seededRandom(randomSeed + filtered.indexOf(b));
          return hashA - hashB;
        });
        return shuffled.slice(0, itemsPerPage);
      case "all":
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
      default:
        return filtered.slice(0, itemsPerPage);
    }
  };

  const totalFilteredItems = getFilteredItems().length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const displayItems = getDisplayItems();

  const handlePreviewModeChange = (mode: "first" | "random" | "all") => {
    setPreviewMode(mode);
    setCurrentPage(1);
    if (mode === "random") {
      setRandomSeed(Math.random());
    }
  };

  const generateNewRandomSample = () => {
    setRandomSeed(Math.random());
  };

  // Fetch user locations on component mount
  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        if (!session?.access_token) {
          console.error("No access token available");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/locations`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setLocations(data.locations || []);
          if (data.locations?.length === 1) {
            setSelectedLocation(data.locations[0].id);
          }
        } else {
          console.error(
            "Failed to fetch locations:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      }
    };

    if (session?.access_token) {
      fetchLocations();
    }
  }, [session]);

  const parseFile = useCallback((file: File) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      Papa.parse(file, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const headers = results.data[0] as string[];
            const rows = results.data.slice(1) as any[][];
            setParsedData({
              headers,
              rows: rows.filter((row) => row.some((cell) => cell !== "")), // Filter out empty rows
              fileName: file.name,
            });
            setStep("mapping");
          }
        },
        header: false,
        skipEmptyLines: true,
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[][];

        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData
            .slice(1)
            .filter((row) => row.some((cell) => cell !== ""));
          setParsedData({
            headers,
            rows,
            fileName: file.name,
          });
          setStep("mapping");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          parseFile(acceptedFiles[0]);
        }
      },
      [parseFile]
    ),
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handleFieldMapping = (fieldKey: string, columnIndex: number | null) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldKey]: columnIndex,
    }));
  };

  const validateMapping = (): boolean => {
    const missingRequired = REQUIRED_FIELDS.filter(
      (field) =>
        fieldMapping[field.key] === null ||
        fieldMapping[field.key] === undefined
    );

    if (missingRequired.length > 0) {
      setErrors([
        `Please map the following required fields: ${missingRequired
          .map((f) => f.label)
          .join(", ")}`,
      ]);
      return false;
    }

    if (!selectedLocation) {
      setErrors(["Please select a location for the inventory items"]);
      return false;
    }

    setErrors([]);
    return true;
  };

  const generatePreview = () => {
    if (!parsedData || !validateMapping()) return;

    const items = parsedData.rows
      .map((row, index) => {
        const item: any = {
          rowIndex: index + 1,
          location_id: selectedLocation,
        };

        ALL_FIELDS.forEach((field) => {
          const columnIndex = fieldMapping[field.key];
          if (columnIndex !== null && columnIndex !== undefined) {
            let value = row[columnIndex];

            // Convert numeric fields
            if (field.key === "quantity" || field.key === "threshold") {
              value = value ? parseFloat(value) : null;
            }

            item[field.key] = value;
          }
        });

        return item;
      })
      .filter((item) => item.name); // Filter out items without names

    setMappedItems(items);
    setStep("preview");
  };

  const handleImport = async () => {
    setStep("importing");

    try {
      if (!session?.access_token) {
        setErrors(["Authentication required. Please log in again."]);
        setStep("preview");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/bulk-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            items: mappedItems,
            location_id: selectedLocation,
            import_mode: importMode,
          }),
        }
      );

      if (response.ok) {
        await refreshInventory();
        const data = await response.json();
        const actionText =
          importMode === "replace_all" ? "replaced" : "imported";
        const skuText = data.generated_skus
          ? ` Generated ${data.generated_skus} unique SKU codes and AI embeddings.`
          : "";

        navigate("/items", {
          state: {
            message: `Successfully ${actionText} ${mappedItems.length} items!${skuText}`,
            type: "success",
          },
        });
      } else {
        const errorData = await response.json();
        setErrors([errorData.message || "Failed to import items"]);
        setStep("preview");
      }
    } catch (error) {
      console.error("Import failed:", error);
      setErrors(["Failed to import items. Please try again."]);
      setStep("preview");
    }
  };

  const handleExportCurrentInventory = async () => {
    try {
      if (!session?.access_token) {
        setErrors(["Authentication required. Please log in again."]);
        return;
      }

      // Fetch current inventory
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        setErrors(["Failed to fetch current inventory"]);
        return;
      }

      const data = await response.json();
      const items = data.items || [];

      if (items.length === 0) {
        setErrors(["No inventory items found to export"]);
        return;
      }

      // Convert to CSV format
      const csvHeaders = [
        "Product Name",
        "Quantity",
        "Unit",
        "Category",
        "Low Stock Threshold",
        "Description",
      ];
      const csvRows = items.map((item: any) => [
        item.name || "",
        item.quantity || 0,
        item.unit || "",
        item.category || "",
        item.threshold || "",
        item.description || "",
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row: any[]) =>
          row
            .map((field: any) =>
              // Escape fields that contain commas, quotes, or newlines
              typeof field === "string" &&
              (field.includes(",") ||
                field.includes('"') ||
                field.includes("\n"))
                ? `"${field.replace(/"/g, '""')}"`
                : field
            )
            .join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `inventory_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      setErrors(["Failed to export inventory. Please try again."]);
    }
  };

  const handleDownloadSampleCSV = () => {
    // Create sample data
    const sampleHeaders = [
      "Product Name",
      "Quantity",
      "Unit",
      "Category",
      "Low Stock Threshold",
      "Description",
    ];
    const sampleData = [
      [
        "Apple iPhone 15",
        "50",
        "pieces",
        "Electronics",
        "10",
        "Latest iPhone model",
      ],
      [
        "Wireless Headphones",
        "25",
        "pieces",
        "Electronics",
        "5",
        "Bluetooth wireless headphones",
      ],
      [
        "Office Chair",
        "15",
        "pieces",
        "Furniture",
        "3",
        "Ergonomic office chair",
      ],
      [
        "Organic Coffee Beans",
        "100",
        "kg",
        "Food & Beverage",
        "20",
        "Premium organic coffee",
      ],
      [
        "Notebook Set",
        "200",
        "pieces",
        "Stationery",
        "25",
        "Pack of 5 notebooks",
      ],
    ];

    // Create CSV content
    const csvContent = [
      sampleHeaders.join(","),
      ...sampleData.map((row: string[]) =>
        row
          .map((field: string) =>
            field.includes(",") || field.includes('"') || field.includes("\n")
              ? `"${field.replace(/"/g, '""')}"`
              : field
          )
          .join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample-inventory.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderUploadStep = () => (
    <div className="sm:flex-auto">
      <div className="mb-8">
        <Heading level={1}>Import Your Inventory</Heading>
        <Text>
          Upload a CSV or Excel file to get started. We'll help you map your
          data to our inventory system.
        </Text>
      </div>

      {/* Sample file download */}
      <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <Text className="mb-3">
          Need a template? Download our sample file to see the expected format:
        </Text>
        <Button
          onClick={handleDownloadSampleCSV}
          outline
          className="inline-flex items-center"
        >
          <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
          Download Sample CSV
        </Button>
        <Text className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Note: SKU codes are auto-generated - no need to include them in your
          file
        </Text>
      </div>

      {/* Export current inventory */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Text className="mb-3">
          Want to bulk edit your existing inventory? Export your current data,
          make changes, and re-import:
        </Text>
        <Button
          onClick={handleExportCurrentInventory}
          outline
          className="inline-flex items-center"
        >
          <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
          Export Current Inventory
        </Button>
      </div>

      {/* Auto-generation info */}
      <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
          ✨ Smart Features Included:
        </h3>
        <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
          <div>
            <strong>Auto SKU Generation:</strong> Unique product codes created
            automatically
          </div>
          <div>
            <strong>AI-Powered Search:</strong> Items indexed for intelligent
            search and recommendations
          </div>
          <div>
            <strong>Smart Matching:</strong> Existing items updated by product
            name matching
          </div>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`mt-8 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
            : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
        }`}
      >
        <input {...getInputProps()} />
        <DocumentArrowUpIcon className="h-12 w-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" />
        {isDragActive ? (
          <Text className="text-zinc-600 dark:text-zinc-400">
            Drop your file here...
          </Text>
        ) : (
          <div>
            <Text className="mb-2">
              Drag and drop your CSV or Excel file here, or click to browse
            </Text>
            <Text className="text-sm mb-4">
              Supported formats: .csv, .xlsx, .xls
            </Text>
            <Text className="text-xs">Maximum file size: 10MB</Text>
          </div>
        )}
      </div>

      {/* Expected format info */}
      <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white mb-2">
          Expected File Format:
        </h3>
        <Text className="mb-2">
          Your file should contain columns for the following required fields:
        </Text>
        <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
          <li>
            •{" "}
            <strong className="text-zinc-950 dark:text-white">
              Product Name
            </strong>{" "}
            - Name of the inventory item
          </li>
          <li>
            •{" "}
            <strong className="text-zinc-950 dark:text-white">Quantity</strong>{" "}
            - Current stock quantity (numbers only)
          </li>
          <li>
            • <strong className="text-zinc-950 dark:text-white">Unit</strong> -
            Unit of measurement (e.g., pieces, kg, liters)
          </li>
          <li>
            •{" "}
            <strong className="text-zinc-950 dark:text-white">Category</strong>{" "}
            - Product category
          </li>
        </ul>
        <Text className="mt-2">
          Optional fields: Low Stock Threshold, Description
        </Text>
      </div>

      {/* Bulk editing strategies */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
          💡 Bulk Editing Strategies:
        </h3>
        <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <div>
            <strong>New Inventory:</strong> Use the sample template or create
            your own file
          </div>
          <div>
            <strong>Update Existing:</strong> Export current data, edit in
            Excel/Sheets, then re-import
          </div>
          <div>
            <strong>Replace Everything:</strong> Import new file and select
            "Replace All" mode
          </div>
          <div>
            <strong>Partial Updates:</strong> Import file with just items to
            change (matches by name)
          </div>
        </div>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="sm:flex-auto">
      <div className="mb-8">
        <Heading level={1}>Map Your Columns</Heading>
        <Text>
          Match your file columns to our inventory fields. Required fields are
          marked with *
        </Text>
      </div>

      {parsedData && (
        <div>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
              File: {parsedData.fileName}
            </h3>
            <Text className="mt-1">{parsedData.rows.length} rows found</Text>
          </div>

          <div className="mt-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                Select Location *
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                required
              >
                <option value="">Choose a location...</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Import Mode Selection */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <label className="block text-sm font-medium text-zinc-950 dark:text-white mb-3">
                Import Mode *
              </label>
              <div className="space-y-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="add_update"
                    checked={importMode === "add_update"}
                    onChange={(e) =>
                      setImportMode(
                        e.target.value as "add_update" | "replace_all"
                      )
                    }
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 border-zinc-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-zinc-950 dark:text-white">
                      Add & Update Items (Recommended)
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Add new items and update existing ones. Your current
                      inventory will be preserved.
                    </div>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace_all"
                    checked={importMode === "replace_all"}
                    onChange={(e) =>
                      setImportMode(
                        e.target.value as "add_update" | "replace_all"
                      )
                    }
                    className="mt-1 mr-3 h-4 w-4 text-red-600 border-zinc-300 focus:ring-red-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-zinc-950 dark:text-white">
                      Replace All Inventory
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      ⚠️ Delete all existing items in this location and replace
                      with imported data.
                    </div>
                  </div>
                </label>
              </div>

              {importMode === "replace_all" && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Text className="text-red-700 dark:text-red-400 text-sm font-medium">
                      Warning: This will permanently delete all existing
                      inventory in the selected location.
                    </Text>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {ALL_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-4 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 gap-3"
                >
                  <div className="flex-1 sm:max-w-md">
                    <label className="text-sm font-medium text-zinc-950 dark:text-white">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {field.description}
                    </Text>
                  </div>
                  <div className="flex-1 sm:max-w-xs">
                    <select
                      value={fieldMapping[field.key] ?? ""}
                      onChange={(e) =>
                        handleFieldMapping(
                          field.key,
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value)
                        )
                      }
                      className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={index}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                {errors.map((error, index) => (
                  <Text
                    key={index}
                    className="text-red-700 dark:text-red-400 text-sm"
                  >
                    {error}
                  </Text>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                outline
                onClick={() => setStep("upload")}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                color="blue"
                onClick={generatePreview}
                className="w-full sm:w-auto"
              >
                Preview Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="sm:flex-auto">
      <div className="mb-8">
        <Heading level={1}>Preview Your Data</Heading>
        <Text>
          Review your mapped data before importing. Use the controls below to
          spot check specific items.
        </Text>
      </div>

      {/* Import Mode Summary */}
      <div
        className={`mb-6 p-4 rounded-lg border ${
          importMode === "replace_all"
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        }`}
      >
        <div className="flex items-center mb-2">
          {importMode === "replace_all" ? (
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <Text
            className={`font-medium ${
              importMode === "replace_all"
                ? "text-red-700 dark:text-red-400"
                : "text-blue-700 dark:text-blue-400"
            }`}
          >
            Import Mode:{" "}
            {importMode === "replace_all"
              ? "Replace All Inventory"
              : "Add & Update Items"}
          </Text>
        </div>
        <Text
          className={`text-sm ${
            importMode === "replace_all"
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        >
          {importMode === "replace_all"
            ? "All existing inventory in this location will be deleted and replaced with the items below."
            : "New items will be added and existing items will be updated based on matching names."}
        </Text>
      </div>

      {/* Auto-generation Features */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center mb-2">
          <svg
            className="h-5 w-5 text-green-600 dark:text-green-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <Text className="font-medium text-green-700 dark:text-green-400">
            🚀 Automatic Enhancements
          </Text>
        </div>
        <div className="space-y-1 text-sm text-green-600 dark:text-green-400">
          <div>
            <strong>Unique SKU Codes:</strong> Each item will get an
            auto-generated SKU (e.g., ELEC-2024-0001)
          </div>
          <div>
            <strong>AI Embeddings:</strong> Items will be indexed for smart
            search and recommendations
          </div>
          <div>
            <strong>Smart Matching:</strong> Existing items are matched by name
            for updates
          </div>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Search Items
            </label>
            <input
              type="text"
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              placeholder="Search by name, category..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md 
                bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Preview Mode */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              View Mode
            </label>
            <select
              value={previewMode}
              onChange={(e) =>
                handlePreviewModeChange(
                  e.target.value as "first" | "random" | "all"
                )
              }
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md 
                bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="first">First 10 items</option>
              <option value="random">Random sample</option>
              <option value="all">Browse all items</option>
            </select>
          </div>

          {/* Random Sample Button */}
          <div className="flex items-end">
            {previewMode === "random" && (
              <Button
                onClick={generateNewRandomSample}
                outline
                className="w-full text-sm"
              >
                New Random Sample
              </Button>
            )}
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {previewSearch && (
            <Text className="mb-1">
              Found {totalFilteredItems} items matching "{previewSearch}"
            </Text>
          )}
          <Text>
            Showing {displayItems.length} of {totalFilteredItems} items
            {previewMode === "random" && " (random sample)"}
            {previewMode === "all" &&
              totalPages > 1 &&
              ` (page ${currentPage} of ${totalPages})`}
          </Text>
        </div>
      </div>

      {/* Pagination for Browse All mode */}
      {previewMode === "all" && totalPages > 1 && (
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            outline
            className="text-sm"
          >
            Previous
          </Button>
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            outline
            className="text-sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          {errors.map((error, index) => (
            <Text
              key={index}
              className="text-red-700 dark:text-red-400 text-sm"
            >
              {error}
            </Text>
          ))}
        </div>
      )}

      {displayItems.length === 0 ? (
        <div className="text-center py-8">
          <Text className="text-zinc-500 dark:text-zinc-400">
            {previewSearch
              ? "No items match your search criteria."
              : "No items to preview."}
          </Text>
        </div>
      ) : (
        <div className="mt-6">
          {/* Mobile card view for small screens */}
          <div className="lg:hidden space-y-4">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-zinc-950 dark:text-white">
                    {item.name}
                  </h4>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Row {item.rowIndex}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Quantity:
                    </span>
                    <span className="ml-1 text-zinc-950 dark:text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Unit:
                    </span>
                    <span className="ml-1 text-zinc-950 dark:text-white">
                      {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Category:
                    </span>
                    <span className="ml-1 text-zinc-950 dark:text-white">
                      {item.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Threshold:
                    </span>
                    <span className="ml-1 text-zinc-950 dark:text-white">
                      {item.threshold || "-"}
                    </span>
                  </div>
                </div>
                {item.description && (
                  <div className="mt-2 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Description:
                    </span>
                    <span className="ml-1 text-zinc-950 dark:text-white">
                      {item.description}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Row
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Threshold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-inherit">
                {displayItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {item.rowIndex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-950 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {item.threshold || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {item.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setStep("mapping")}
          outline
          className="sm:order-1"
        >
          Back to Mapping
        </Button>
        <Button
          onClick={handleImport}
          className="sm:order-2"
          disabled={mappedItems.length === 0}
        >
          {importMode === "replace_all"
            ? `Replace All with ${mappedItems.length} Items`
            : `Import ${mappedItems.length} Items`}
        </Button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="sm:flex-auto text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-600 dark:border-zinc-400 mx-auto mb-4"></div>
      <Heading level={1}>Importing Items...</Heading>
      <Text className="mt-2">
        Please wait while we add your {mappedItems.length} items to the
        inventory.
      </Text>
    </div>
  );

  return (
    <div className="min-h-screen bg-inherit max-w-7xl py-6">
      {/* Progress indicator */}
      <div className="mb-8 px-4">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          {["upload", "mapping", "preview", "importing"].map(
            (stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step === stepName
                      ? "bg-zinc-600 dark:bg-zinc-500 text-white"
                      : index <
                        ["upload", "mapping", "preview", "importing"].indexOf(
                          step
                        )
                      ? "bg-green-600 dark:bg-green-500 text-white"
                      : "bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {index <
                  ["upload", "mapping", "preview", "importing"].indexOf(
                    step
                  ) ? (
                    <CheckIcon className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className="w-8 sm:w-16 h-1 bg-zinc-300 dark:bg-zinc-600 mx-1 sm:mx-2"></div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {step === "upload" && renderUploadStep()}
      {step === "mapping" && renderMappingStep()}
      {step === "preview" && renderPreviewStep()}
      {step === "importing" && renderImportingStep()}
    </div>
  );
};

export default Onboarding;
