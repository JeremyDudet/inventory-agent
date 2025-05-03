// frontend/src/App.tsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import StockList from "./pages/StockList";

// Protected route component that uses Supabase auth
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

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
  const { user, isLoading } = useAuth();

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
          <Route path="/stocklist" element={<StockList />} />
          <Route path="/items" element={<Items />} />
          <Route path="/orders" element={<div>Orders Page</div>} />
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
    <ThemeProvider>
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <WebsocketListener />
            <AppRoutes />
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
