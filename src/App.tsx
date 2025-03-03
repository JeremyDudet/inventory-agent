// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LoadingSpinner from './components/LoadingSpinner';

// Protected route component that uses Supabase auth
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
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
    return <Navigate to="/dashboard" />;
  }
  
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <NotificationProvider>
          <div className="app min-h-screen bg-base-100 text-base-content transition-colors duration-200">
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </div>
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
