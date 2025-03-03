import React, { useState, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

/**
 * Notification component displays toast-style messages
 * with different styles based on the notification type
 */
const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 3000,
  onClose,
  isVisible
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);

  useEffect(() => {
    setIsShowing(isVisible);
    
    let timer: NodeJS.Timeout;
    
    if (isVisible && duration > 0) {
      timer = setTimeout(() => {
        // Start exit animation
        const element = document.getElementById(`notification-${type}-${message.slice(0, 10)}`);
        if (element) {
          element.style.animation = 'slideOut 0.3s ease-in forwards, fadeOut 0.3s ease-in forwards';
          
          // Actually remove after animation completes
          setTimeout(() => {
            setIsShowing(false);
            if (onClose) onClose();
          }, 300);
        } else {
          // Fallback if element not found
          setIsShowing(false);
          if (onClose) onClose();
        }
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, duration, onClose, type, message]);

  // If not showing, don't render anything
  if (!isShowing) return null;

  // Map type to appropriate DaisyUI alert classes
  const alertClasses = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning'
  };

  // Map type to appropriate icon with enhanced styling
  const getIcon = () => {
    const iconClasses = `stroke-current shrink-0 h-6 w-6 ${
      type === 'success' ? 'text-success' :
      type === 'error' ? 'text-error' :
      type === 'warning' ? 'text-warning' :
      'text-info'
    }`;
    
    switch (type) {
      case 'success':
        return (
          <div className="p-2 rounded-full bg-success/20">
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="p-2 rounded-full bg-error/20">
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="p-2 rounded-full bg-warning/20">
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className="p-2 rounded-full bg-info/20">
            <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div 
      id={`notification-${type}-${message.slice(0, 10)}`}
      className={`notification-item transition-all duration-300 w-full opacity-100 hover:shadow-2xl`}
      style={{
        animation: `slideIn 0.3s ease-out forwards, fadeIn 0.3s ease-out forwards`
      }}
    >
      <div className={`flex items-center p-4 rounded-lg shadow-xl border ${
        type === 'success' ? 'border-success/40 bg-base-100 text-base-content' :
        type === 'error' ? 'border-error/40 bg-base-100 text-base-content' :
        type === 'warning' ? 'border-warning/40 bg-base-100 text-base-content' :
        'border-info/40 bg-base-100 text-base-content'
      }`}>
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm font-semibold leading-5">{message}</p>
        </div>
        <button 
          onClick={() => {
            setIsShowing(false);
            if (onClose) onClose();
          }} 
          className={`rounded-full p-1 hover:bg-base-200 transition-colors duration-150 ${
            type === 'success' ? 'text-success hover:bg-success/20' :
            type === 'error' ? 'text-error hover:bg-error/20' :
            type === 'warning' ? 'text-warning hover:bg-warning/20' :
            'text-info hover:bg-info/20'
          }`}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Add styles for animation - using regular style tag */}
      <style dangerouslySetInnerHTML={{ 
        __html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
      `}} />
    </div>
  );
};

export default Notification; 