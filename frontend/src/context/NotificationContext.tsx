import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification from '../components/Notification';
import { ApiError } from '../services/api';

// Define notification type
export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'auth-error';

// Define notification interface
interface NotificationData {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

// Define context interface
interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  showApiError: (error: Error | ApiError, fallbackMessage?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  showApiError: () => {},
  removeNotification: () => {},
});

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Add a new notification
  const addNotification = (type: NotificationType, message: string, duration = 5000) => {
    const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Limit to maximum 3 notifications at once
    setNotifications((prev) => {
      const newNotifications = [...prev, { id, type, message, duration }];
      // If more than 3, remove the oldest one
      return newNotifications.length > 3 ? newNotifications.slice(-3) : newNotifications;
    });
    
    // Auto-remove notification after duration
    if (duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  // Remove a notification by ID
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // Show API error with appropriate styling based on error type
  const showApiError = (error: Error | ApiError, fallbackMessage = 'An error occurred', duration = 6000) => {
    const apiError = error as ApiError;
    
    // Determine if this is an auth/permission error
    const isAuthError = apiError.isAuthError || 
      apiError.status === 401 || 
      apiError.status === 403;
    
    // Get the error message
    const errorMessage = error.message || fallbackMessage;
    
    // Add notification with appropriate type
    addNotification(
      isAuthError ? 'auth-error' : 'error',
      errorMessage,
      duration
    );
    
    // If it's an auth error, handle potential redirection
    if (isAuthError) {
      console.warn('Authentication error:', error);
      // You could trigger auth-related actions here if needed
      // such as showing a login modal or redirecting to login page
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, showApiError, removeNotification }}>
      {children}
      <div className="notifications-container fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            isVisible={true}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 