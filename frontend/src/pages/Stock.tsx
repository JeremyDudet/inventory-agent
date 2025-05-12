// frontend/src/pages/StockList.tsx
import { useState } from "react";
import { useInventoryStore } from "../stores/inventoryStore";
import { useFilterStore } from "../stores/filterStore";
import type {
  InventoryItem,
  InventoryCategory,
} from "../stores/inventoryStore";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { InputCountDrawer } from "@/components/InputCountDrawer";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

export default function StockList() {
  const { items, categories, error } = useInventoryStore();
  const {
    stockList: { searchQuery, selectedCategories },
    setStockListSearchQuery,
    setStockListSelectedCategories,
  } = useFilterStore();

  // Filter items based on selected categories and search query
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Show error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-inherit max-w-7xl p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-200">
            Error
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-inherit max-w-7xl">
      <InventoryListWithStickyHeader
        items={filteredItems}
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setStockListSelectedCategories}
        searchQuery={searchQuery}
        setSearchQuery={setStockListSearchQuery}
      />
    </div>
  );
}

function InventoryListWithStickyHeader({
  items,
  categories,
  selectedCategories,
  setSelectedCategories,
  searchQuery,
  setSearchQuery,
}: {
  items: InventoryItem[];
  categories: InventoryCategory[];
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  return (
    <>
      <div className="sm:flex-auto">
        {/* Header */}
        <div>
          <Heading level={1}>Stock</Heading>
          <Text>Input your stock counts</Text>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col gap-2 mt-12 w-full justify-center">
          <div className="flex gap-2">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
            />
          </div>

          {/* Active filters */}
          <div className="bg-inherit mt-2">
            <div className="max-w-7xl sm:flex sm:items-center sm:px-6 lg:px-8">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Filters
                <span className="sr-only">, active</span>
              </h3>

              <div
                aria-hidden="true"
                className="hidden h-5 w-px bg-zinc-500 dark:bg-zinc-400 sm:ml-4 sm:block"
              />

              <div className="mt-2 sm:ml-4 sm:mt-0">
                <div className="-m-1 flex flex-wrap items-center">
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="m-1 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 py-1.5 pl-3 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-200"
                    >
                      <span>{category}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== category)
                          )
                        }
                        className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400"
                      >
                        <span className="sr-only">
                          Remove filter for {category}
                        </span>
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 8 8"
                          className="size-2"
                        >
                          <path
                            d="M1 1l6 6m0-6L1 7"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="-mx-4 mt-12 sm:-mx-0">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr- text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:pl-0"
              >
                Name
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell"
              >
                Unit
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 lg:table-cell"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 text-nowrap"
              >
                Last Updated
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-inherit">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:w-auto sm:max-w-none sm:pl-0">
                  {item.name}
                  <dl className="font-normal lg:hidden">
                    <dt className="sr-only">Quantity</dt>
                    <dd className="mt-1 truncate text-zinc-700 dark:text-zinc-300">
                      {item.quantity} {item.unit}
                    </dd>
                    <dt className="sr-only sm:hidden">Category</dt>
                    <dd className="mt-1 truncate text-zinc-500 dark:text-zinc-400 sm:hidden">
                      {item.category}
                    </dd>
                  </dl>
                </td>
                <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {item.quantity}
                </td>
                <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {item.unit}
                </td>
                <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 lg:table-cell">
                  {item.category}
                </td>
                <td className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(item.lastupdated).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 whitespace-nowrap">
                  <a
                    href="#"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                  >
                    <InputCountDrawer
                      item={item}
                      onUpdate={() => {
                        // The state will be automatically updated through the WebSocket listener
                        // and the inventory store
                      }}
                    >
                      <span>
                        Edit
                        <span className="sr-only">, {item.name}</span>
                      </span>
                    </InputCountDrawer>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full">
      <Input
        id="search"
        name="search"
        type="search"
        placeholder="Search item..."
        aria-label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CategoryFilter({
  categories,
  selectedCategories,
  setSelectedCategories,
}: {
  categories: InventoryCategory[];
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category]
    );
  };

  return (
    <>
      <MobileCategoryFilter
        open={open}
        setOpen={setOpen}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
      />

      {/* Filters */}
      <section
        aria-labelledby="filter-heading"
        className="flex items-center justify-center text-zinc-900 dark:text-zinc-100"
      >
        <h2
          id="filter-heading"
          className="sr-only text-zinc-900 dark:text-zinc-100"
        >
          Filters
        </h2>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300 sm:hidden"
          >
            Filters
          </button>

          <div className="hidden sm:block">
            <div className="flow-root">
              <PopoverGroup className="-mx-4 flex items-center divide-x divide-zinc-200 dark:divide-zinc-700">
                <Popover className="relative inline-block px-4 text-left">
                  <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300">
                    <span className="flex items-center">Category</span>
                    {selectedCategories.length > 0 && (
                      <span className="ml-1.5 flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                        {selectedCategories.length}
                      </span>
                    )}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="-mr-1 ml-1 size-5 shrink-0 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400"
                    />
                  </PopoverButton>

                  <PopoverPanel
                    transition
                    className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white dark:bg-zinc-800 p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    <form className="space-y-4">
                      {categories.map((category) => (
                        <div
                          key={category.name}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                checked={selectedCategories.includes(
                                  category.name
                                )}
                                onChange={() =>
                                  handleCategoryToggle(category.name)
                                }
                                id={`filter-category-${category.name}`}
                                name="category[]"
                                type="checkbox"
                                className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400 indeterminate:border-zinc-600 dark:indeterminate:border-zinc-400 indeterminate:bg-zinc-600 dark:indeterminate:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:focus-visible:outline-zinc-400 disabled:border-zinc-300 dark:disabled:border-zinc-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:checked:bg-zinc-100 dark:disabled:checked:bg-zinc-900 forced-colors:appearance-auto"
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900 group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-zinc-50/25"
                              >
                                <motion.path
                                  d="M3 8L6 11L11 3.5"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{
                                    pathLength: selectedCategories.includes(
                                      category.name
                                    )
                                      ? 1
                                      : 0,
                                  }}
                                  transition={{ duration: 0.3 }}
                                />
                              </svg>
                            </div>
                          </div>
                          <label
                            htmlFor={`filter-category-${category.name}`}
                            className="flex items-center whitespace-nowrap pr-6 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </form>
                  </PopoverPanel>
                </Popover>
              </PopoverGroup>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MobileCategoryFilter({
  open,
  setOpen,
  categories,
  selectedCategories,
  onCategoryToggle,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  categories: InventoryCategory[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}) {
  return (
    <>
      {/* Mobile filter dialog */}
      <Dialog
        open={open}
        onClose={setOpen}
        className="relative z-4000 sm:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative ml-auto flex size-full max-w-xs max-h-screen outline outline-zinc-200 dark:outline-zinc-700 transform flex-col overflow-y-auto bg-white dark:bg-zinc-900 py-4 pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:translate-x-full"
          >
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-mr-2 flex size-10 items-center justify-center rounded-md bg-inherit p-2 text-zinc-400"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            {/* Filters */}
            <form className="mt-4">
              <Disclosure
                as="div"
                className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-6"
              >
                <h3 className="-mx-2 -my-3 flow-root">
                  <DisclosureButton className="group flex w-full items-center justify-between px-2 py-3 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      Category
                    </span>
                    <span className="ml-6 flex items-center">
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="size-5 rotate-0 transform group-data-[open]:-rotate-180"
                      />
                    </span>
                  </DisclosureButton>
                </h3>
                <DisclosurePanel className="pt-6">
                  <div className="space-y-6">
                    {categories.map((category) => (
                      <div key={category.name} className="flex gap-3">
                        <div className="flex h-5 shrink-0 items-center">
                          <div className="group grid size-4 grid-cols-1">
                            <input
                              checked={selectedCategories.includes(
                                category.name
                              )}
                              onChange={() => onCategoryToggle(category.name)}
                              id={`filter-mobile-category-${category.name}`}
                              name="category[]"
                              type="checkbox"
                              className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400 indeterminate:border-zinc-600 dark:indeterminate:border-zinc-400 indeterminate:bg-zinc-600 dark:indeterminate:bg-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:focus-visible:outline-zinc-400 disabled:border-zinc-300 dark:disabled:border-zinc-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:checked:bg-zinc-100 dark:disabled:checked:bg-zinc-900 forced-colors:appearance-auto"
                            />
                            <svg
                              fill="none"
                              viewBox="0 0 14 14"
                              className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900 group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-zinc-50/25"
                            >
                              <motion.path
                                d="M3 8L6 11L11 3.5"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{
                                  pathLength: selectedCategories.includes(
                                    category.name
                                  )
                                    ? 1
                                    : 0,
                                }}
                                transition={{ duration: 0.3 }}
                              />
                            </svg>
                          </div>
                        </div>
                        <label
                          htmlFor={`filter-mobile-category-${category.name}`}
                          className="text-sm text-zinc-900 dark:text-zinc-100"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </DisclosurePanel>
              </Disclosure>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
