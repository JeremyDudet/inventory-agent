import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  fullScreen?: boolean;
  text?: string;
}

/**
 * LoadingSpinner component displays a loading animation
 * with customizable size, color, and text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text
}) => {
  // Map size to Tailwind classes
  const sizeClasses = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  // Create the spinner element
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'h-screen' : ''}`}>
      <span className={`loading loading-spinner ${sizeClasses[size]} text-${color}`}></span>
      {text && <p className="mt-4 text-base-content/70">{text}</p>}
    </div>
  );

  // If fullScreen, add a backdrop
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-base-200 bg-opacity-75 z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 