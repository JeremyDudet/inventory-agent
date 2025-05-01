// frontend/src/pages/StockList.tsx
// Purpose: Allow users to manually update stock levels.
import React from "react";
import { useInventoryStore } from "../stores/inventoryStore";
import type { InventoryItem } from "../stores/inventoryStore";

export default function StockList() {
  const { items } = useInventoryStore();
  return (
    <div className="min-h-screen bg-inherit">
      <div className="mx-auto max-w-7xl">
        <InventoryListWithStickyHeader items={items} />
      </div>
    </div>
  );
}

function InventoryListWithStickyHeader({ items }: { items: InventoryItem[] }) {
  return (
    <>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semiboldd text-zinc-900 dark:text-zinc-200">
            Stock List
          </h1>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            Manually update counts.
          </p>
        </div>
        {/* <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Add Item
          </button>
        </div> */}
      </div>
      <div className="-mx-4 mt-8 sm:-mx-0 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 overflow-x-hidden ">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr- text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-0"
              >
                Name
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:table-cell"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:table-cell"
              >
                Unit
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 lg:table-cell"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 text-nowrap"
              >
                Last Updated
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-inherit">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:w-auto sm:max-w-none sm:pl-0">
                  {item.name}
                  <dl className="font-normal lg:hidden">
                    <dt className="sr-only">Quantity</dt>
                    <dd className="mt-1 truncate text-gray-700 dark:text-gray-300">
                      {item.quantity} {item.unit}
                    </dd>
                    <dt className="sr-only sm:hidden">Category</dt>
                    <dd className="mt-1 truncate text-gray-500 dark:text-gray-400 sm:hidden">
                      {item.category}
                    </dd>
                  </dl>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                  {item.quantity}
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                  {item.unit}
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 dark:text-gray-400 lg:table-cell">
                  {item.category}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.lastupdated).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                  <a
                    href="#"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                  >
                    Edit<span className="sr-only">, {item.name}</span>
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
