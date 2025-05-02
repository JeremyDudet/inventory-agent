import { useState } from "react";
import { useInventoryStore } from "../stores/inventoryStore";
import type { InventoryItem } from "../stores/inventoryStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

const filters = [
  {
    id: "category",
    name: "Category",
    options: [
      { value: "new-arrivals", label: "All New Arrivals", checked: false },
      { value: "tees", label: "Tees", checked: false },
      { value: "objects", label: "Objects", checked: true },
    ],
  },
];

const activeFilters = [{ value: "object1", label: "Object 1" }];

export default function ItemsPage() {
  const { items } = useInventoryStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleAddItem = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-inherit max-w-7xl">
      <div className="sm:flex-auto">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <Heading level={1}>Items</Heading>
            <Text>Manage item data.</Text>
          </div>
          {/* Add Item Button */}
          <div>
            <button
              className="font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:cursor-pointer"
              onClick={handleAddItem}
            >
              + New Item
            </button>
          </div>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col gap-2 mt-12 w-full justify-center">
          <div className="flex gap-2">
            <SearchBar />
            <CategoryFilter />
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
                  {activeFilters.map((activeFilter) => (
                    <span
                      key={activeFilter.value}
                      className="m-1 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 py-1.5 pl-3 pr-2 text-sm font-medium text-zinc-900 dark:text-zinc-200"
                    >
                      <span>{activeFilter.label}</span>
                      <button
                        type="button"
                        className="ml-1 inline-flex size-4 shrink-0 rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400"
                      >
                        <span className="sr-only">
                          Remove filter for {activeFilter.label}
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

        {/* Table */}
        <div className="-mx-4 mt-12 sm:-mx-0 overflow-x-hidden">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:pl-0">
                  Name
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  Category
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  Price
                </th>
                <th className="hidden px-3 py-3.5 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400 lg:table-cell">
                  Supplier
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
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
                      <dt className="sr-only">Category</dt>
                      <dd className="mt-1 truncate text-zinc-500 dark:text-zinc-400 sm:hidden">
                        {item.category}
                      </dd>
                    </dl>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                    {item.category}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                    {/* ${Number(item.price || 0).toFixed(2)} */}
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 lg:table-cell">
                    {/* {item.supplier || "N/A"} */}
                  </td>
                  <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                    >
                      Edit<span className="sr-only">, {item.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder for Modal */}
      {/* A modal component would be implemented here using Dialog from @headlessui/react */}
    </div>
  );
}

function SearchBar() {
  return (
    <div className="w-full">
      <Input
        id="search"
        name="search"
        type="search"
        placeholder="Search item..."
        aria-label="Search"
      />
    </div>
  );
}

function CategoryFilter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MobileCategoryFilter open={open} setOpen={setOpen} />
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
            <PopoverGroup className="-mx-4 flex items-center divide-x divide-zinc-200 dark:divide-zinc-700">
              {filters.map((section, sectionIdx) => (
                <Popover
                  key={section.name}
                  className="relative inline-block px-4 text-left"
                >
                  <PopoverButton className="group inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300">
                    <span className="flex items-center">{section.name}</span>
                    {sectionIdx === 0 ? (
                      <span className="ml-1.5 flex items-center rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                        1
                      </span>
                    ) : null}
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
                      {section.options.map((option, optionIdx) => {
                        const [isChecked, setIsChecked] = useState(
                          option.checked
                        );
                        return (
                          <div
                            key={option.value}
                            className="flex items-center gap-3"
                          >
                            <div className="flex h-5 shrink-0 items-center">
                              <div className="group grid size-4 grid-cols-1">
                                <input
                                  value={option.value}
                                  checked={isChecked}
                                  onChange={(e) =>
                                    setIsChecked(e.target.checked)
                                  }
                                  id={`filter-${section.id}-${optionIdx}`}
                                  name={`${section.id}[]`}
                                  type="checkbox"
                                  className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400"
                                />
                                <svg
                                  fill="none"
                                  viewBox="0 0 14 14"
                                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900"
                                >
                                  <motion.path
                                    d="M3 8L6 11L11 3.5"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: isChecked ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  />
                                </svg>
                              </div>
                            </div>
                            <label
                              htmlFor={`filter-${section.id}-${optionIdx}`}
                              className="flex items-center whitespace-nowrap pr-6 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                            >
                              {option.label}
                            </label>
                          </div>
                        );
                      })}
                    </form>
                  </PopoverPanel>
                </Popover>
              ))}
            </PopoverGroup>
          </div>
        </div>
      </section>
    </>
  );
}

function MobileCategoryFilter({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onClose={setOpen} className="relative z-40 sm:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 z-40 flex">
        <DialogPanel
          transition
          className="relative ml-auto flex size-full max-w-xs max-h-screen transform flex-col overflow-y-auto bg-white dark:bg-zinc-900 py-4 pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:translate-x-full"
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
          <form className="mt-4">
            {filters.map((section) => (
              <Disclosure
                key={section.name}
                as="div"
                className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-6"
              >
                <h3 className="-mx-2 -my-3 flow-root">
                  <DisclosureButton className="group flex w-full items-center justify-between px-2 py-3 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {section.name}
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
                    {section.options.map((option, optionIdx) => {
                      const [isChecked, setIsChecked] = useState(
                        option.checked
                      );
                      return (
                        <div key={option.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                value={option.value}
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                id={`filter-mobile-${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                type="checkbox"
                                className="col-start-1 row-start-1 appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 checked:border-zinc-600 dark:checked:border-zinc-400 checked:bg-zinc-600 dark:checked:bg-zinc-400"
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white dark:stroke-zinc-900"
                              >
                                <motion.path
                                  d="M3 8L6 11L11 3.5"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: isChecked ? 1 : 0 }}
                                  transition={{ duration: 0.3 }}
                                />
                              </svg>
                            </div>
                          </div>
                          <label
                            htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                            className="text-sm text-zinc-900 dark:text-zinc-100"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
