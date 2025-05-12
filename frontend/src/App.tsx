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
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import Settings from "./pages/Settings";
import { WebsocketListener } from "./components/WebsocketListener";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { ApplicationLayout } from "./components/AppLayout";
import { useInventoryStore } from "./stores/inventoryStore";
import Stock from "./pages/Stock";
import { AuthInitializer } from "./components/AuthInitializer";
import ChangeLog from "./pages/ChangeLog";
import { Analytics } from "@vercel/analytics/next";

// Protected route component that uses Supabase auth
const ProtectedRoute = () => {
  const { user, isLoading } = useAuthStore();

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
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected routes with shared layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stocklist" element={<Stock />} />
          <Route path="/items" element={<Items />} />
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
  const setItems = useInventoryStore((state) => state.setItems);
  const setCategories = useInventoryStore((state) => state.setCategories);
  const { theme } = useThemeStore();

  useEffect(() => {
    // Initialize theme
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
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
  }, [setItems, setCategories]);

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
      </AuthInitializer>
      <Analytics />
    </Router>
  );
};

export default App;
