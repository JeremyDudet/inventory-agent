import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('user') !== null;
};

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  return isAuthenticated() ? <>{element}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  // Set theme from localStorage or default to light
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <div className="app min-h-screen bg-base-100 text-base-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={<ProtectedRoute element={<Dashboard />} />} 
            />
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute element={<Dashboard />} />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </NotificationProvider>
    </Router>
  );
};

export default App;
