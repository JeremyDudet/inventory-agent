import React from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'auth-error';

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
  // Map type to appropriate colors and icons
  const getTypeDetails = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-success/10',
          borderColor: 'border-success/40',
          iconColor: 'text-success',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'error':
      case 'auth-error':
        return {
          bgColor: 'bg-error/10',
          borderColor: 'border-error/40',
          iconColor: 'text-error',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'warning':
        return {
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/40',
          iconColor: 'text-warning',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-info/10',
          borderColor: 'border-info/40',
          iconColor: 'text-info',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const { bgColor, borderColor, iconColor, icon } = getTypeDetails();

  return (
    <Transition
      show={isVisible}
      enter="transform transition duration-300 ease-out"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition duration-100 ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      afterLeave={onClose}
    >
      <div className="pointer-events-auto w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5 lg:max-w-full lg:mx-0 sm:max-w-[260px] sm:mx-auto">
        <div className="p-1.5 sm:p-2 lg:p-1.5">
          <div className="flex items-start lg:items-start">
            <div className={`flex-shrink-0 ${iconColor} ${bgColor} p-0.5 rounded-full mt-0.5`}>
              {icon}
            </div>
            <div className="ml-1.5 sm:ml-2 lg:ml-1.5 flex w-0 flex-1 justify-between">
              <p className="w-0 flex-1 text-[10px] leading-tight sm:text-xs font-medium text-gray-900 break-words lg:text-[10px]" title={message}>
                {message}
              </p>
              {(type === 'error' || type === 'auth-error') && (
                <button
                  type="button"
                  className="ml-1 sm:ml-2 lg:ml-1 shrink-0 rounded-md bg-white text-[10px] sm:text-xs font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 lg:text-[10px]"
                >
                  <span className="hidden sm:inline lg:hidden">Try Again</span>
                  <span className="sm:hidden lg:inline">Retry</span>
                </button>
              )}
            </div>
            <div className="ml-1 sm:ml-2 lg:ml-1 flex shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-3 lg:w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};

export default Notification; 