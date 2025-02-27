import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification from '../components/Notification';

// Define notification type
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

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
  removeNotification: (id: string) => void;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
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
    
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
    
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

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="notifications-container fixed bottom-4 right-4 z-50 flex flex-col gap-2">
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