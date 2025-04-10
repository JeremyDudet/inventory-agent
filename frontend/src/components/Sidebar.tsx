import { HomeIcon, Cog6ToothIcon } from "@heroicons/react/20/solid";

function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 p-4 h-screen">
      {/* Header with Logo */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          StockCount
        </h1>
      </div>
      {/* Navigation */}
      <nav>
        <ul>
          <li className="flex items-center p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <HomeIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
            <span className="text-gray-900 dark:text-gray-100">Dashboard</span>
          </li>
          <li className="flex items-center p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <Cog6ToothIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
            <span className="text-gray-900 dark:text-gray-100">Settings</span>
          </li>
          {/* Add more navigation items as needed */}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
