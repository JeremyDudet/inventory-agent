import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Inventory", href: "/inventory", icon: HomeIcon },
  { name: "Team", href: "/team", icon: UsersIcon },
  { name: "Projects", href: "/projects", icon: FolderIcon },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Documents", href: "/documents", icon: DocumentDuplicateIcon },
  { name: "Reports", href: "/reports", icon: ChartPieIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export default function BottomNavigation() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="flex h-16 items-center justify-around bg-white border-t border-gray-200">
        {navigation.map((item) => {
          const isCurrentPage = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                isCurrentPage
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-indigo-600",
                "flex flex-col items-center justify-center px-2 py-2 text-xs font-medium"
              )}
            >
              <item.icon
                aria-hidden="true"
                className={classNames(
                  isCurrentPage ? "text-indigo-600" : "text-gray-400",
                  "size-6"
                )}
              />
              <span className="mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
