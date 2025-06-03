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
  { key: "name", label: "Product Name", required: true },
  { key: "quantity", label: "Quantity", required: true },
  { key: "unit", label: "Unit", required: true },
  { key: "category", label: "Category", required: true },
];

const OPTIONAL_FIELDS = [
  { key: "threshold", label: "Low Stock Threshold", required: false },
  { key: "description", label: "Description", required: false },
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
          }),
        }
      );

      if (response.ok) {
        await refreshInventory();
        navigate("/items", {
          state: {
            message: `Successfully imported ${mappedItems.length} items!`,
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

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-6 sm:mb-8">
        <Heading>Import Your Inventory</Heading>
        <Text className="mt-2">
          Upload a CSV or Excel file to get started. We'll help you map your
          data to our inventory system.
        </Text>

        {/* Sample file download */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Text className="mb-3 text-sm sm:text-base">
            Need a template? Download our sample file to see the expected
            format:
          </Text>
          <Button
            href="/sample-inventory.csv"
            download="sample-inventory.csv"
            outline
            className="inline-flex items-center text-sm sm:text-base"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Download Sample CSV
          </Button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
            : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
        }`}
      >
        <input {...getInputProps()} />
        <DocumentArrowUpIcon className="h-8 w-8 sm:h-12 sm:w-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" />
        {isDragActive ? (
          <Text className="text-zinc-600 dark:text-zinc-400">
            Drop your file here...
          </Text>
        ) : (
          <div>
            <Text className="mb-2 text-sm sm:text-base">
              Drag and drop your CSV or Excel file here, or click to browse
            </Text>
            <Text className="text-xs sm:text-sm mb-2 sm:mb-4">
              Supported formats: .csv, .xlsx, .xls
            </Text>
            <Text className="text-xs">Maximum file size: 10MB</Text>
          </div>
        )}
      </div>

      {/* Expected format info */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white mb-2">
          Expected File Format:
        </h3>
        <Text className="mb-2 text-sm sm:text-base">
          Your file should contain columns for the following required fields:
        </Text>
        <ul className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
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
        <Text className="mt-2 text-sm sm:text-base">
          Optional fields: Low Stock Threshold, Description
        </Text>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-6 sm:mb-8">
        <Heading level={2}>Map Your Columns</Heading>
        <Text className="mt-2">
          Match your file columns to our inventory fields. Required fields are
          marked with *
        </Text>
      </div>

      {parsedData && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-950 dark:text-white">
              File: {parsedData.fileName}
            </h3>
            <Text className="mt-1 text-sm sm:text-base">
              {parsedData.rows.length} rows found
            </Text>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-950 dark:text-white mb-2">
                Select Location *
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
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

            <div className="space-y-4">
              {ALL_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 gap-2 sm:gap-0"
                >
                  <div className="flex-1">
                    <label className="text-sm font-medium text-zinc-950 dark:text-white">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
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
                      className="w-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
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
              <div className="mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
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

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
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
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8">
      <Heading level={2} className="mb-6">
        Step 3: Preview Your Data
      </Heading>

      <Text className="text-zinc-600 dark:text-zinc-300 mb-6">
        Review your mapped data before importing. Use the controls below to spot
        check specific items.
      </Text>

      {/* Preview Controls */}
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
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
                variant="outline"
                size="sm"
                className="w-full"
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
            variant="outline"
            size="sm"
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
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
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
        <div>
          {/* Mobile card view for small screens */}
          <div className="lg:hidden space-y-4 mb-6">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-4"
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
          <div className="hidden lg:block bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
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
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
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
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setStep("mapping")}
          variant="outline"
          className="sm:order-1"
        >
          Back to Mapping
        </Button>
        <Button
          onClick={() => setStep("importing")}
          className="sm:order-2"
          disabled={mappedItems.length === 0}
        >
          Import {mappedItems.length} Items
        </Button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-600 dark:border-zinc-400 mx-auto mb-4"></div>
      <Heading level={2}>Importing Items...</Heading>
      <Text className="mt-2">
        Please wait while we add your {mappedItems.length} items to the
        inventory.
      </Text>
    </div>
  );

  return (
    <div className="min-h-screen bg-inherit max-w-7xl mx-auto py-4 sm:py-8">
      {/* Progress indicator */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8 px-4 sm:px-6">
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
