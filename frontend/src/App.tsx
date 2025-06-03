// frontend/src/App.tsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Login from "./pages/Login";
import WaitingList from "./pages/WaitingList";
// import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import Settings from "./pages/Settings";
import { WebsocketListener } from "./components/WebsocketListener";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { ApplicationLayout } from "./components/AppLayout";
import { useInventoryStore } from "./stores/inventoryStore";
import StockList from "./pages/Stock";
import { AuthInitializer } from "./components/AuthInitializer";
import ChangeLog from "./pages/ChangeLog";
import { Analytics } from "@vercel/analytics/react";
import GlobalNotifications from "./components/GlobalNotifications";
import Onboarding from "./pages/Onboarding";

// Protected route component that uses Supabase auth
const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();
  const {
    hasInitiallyLoaded,
    setItems,
    setCategories,
    setIsLoading: setInventoryLoading,
  } = useInventoryStore();

  useEffect(() => {
    // Only fetch inventory if authenticated and not already loaded
    if (user && !hasInitiallyLoaded) {
      const fetchInventory = async () => {
        try {
          setInventoryLoading(true);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/inventory`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch inventory");
          const data = await response.json();
          setItems(data.items);
        } catch (error) {
          console.error("Failed to fetch inventory:", error);
        } finally {
          setInventoryLoading(false);
        }
      };

      const fetchCategories = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/inventory/categories`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch categories");
          const data = await response.json();
          setCategories(data.categories);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      };

      fetchInventory();
      fetchCategories();
    }
  }, [user, hasInitiallyLoaded, setItems, setCategories, setInventoryLoading]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Auth routes - redirect to dashboard if already authenticated
const AuthRoute = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Wrap protected routes with ApplicationLayout
const ProtectedLayout = () => {
  return (
    <ApplicationLayout>
      <Outlet />
    </ApplicationLayout>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />

      {/* Auth routes */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<WaitingList />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected routes with shared layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stocklist" element={<StockList />} />
          <Route path="/items" element={<Items />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/orders" element={<div>Orders Page</div>} />
          <Route path="/changelog" element={<ChangeLog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Initialize theme
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthInitializer>
        <WebsocketListener />
        <AppRoutes />
        <GlobalNotifications />
      </AuthInitializer>
      <Analytics />
    </Router>
  );
};

export default App;
