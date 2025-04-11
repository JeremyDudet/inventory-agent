import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/context/ThemeContext";

type FloatingActionBarProps = {
  onVoiceClick?: () => void;
  onTextClick?: () => void;
  className?: string;
};

const WaveformIcon = ({ className }: { className?: string }) => (
  <div
    className={`flex items-center justify-center w-full h-full p-1.5 ${className}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 0 256 256"
      className="w-full h-full"
    >
      <path d="M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z"></path>
    </svg>
  </div>
);

const StyledPencilIcon = ({
  className,
  theme,
}: {
  className?: string;
  theme: string;
}) => (
  <div
    className={`flex items-center justify-center w-full h-full ${className}`}
  >
    <PencilIcon
      className="w-full h-full"
      style={{
        color: theme === "light" ? "rgb(39 39 42)" : "rgb(244 244 245)",
      }}
    />
  </div>
);

export function FloatingActionBar({
  onVoiceClick,
  onTextClick,
  className,
}: FloatingActionBarProps) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile state when window resizes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Base classes for main container
  const containerClasses = clsx(
    // Base
    "fixed z-10 flex items-center justify-between",
    // Shape - using rounded-lg instead of rounded-full to match app style
    "rounded-xl",
    // Sizing
    "h-14",
    // Common positioning
    "bottom-5 md:bottom-8",
    // Mobile sizing and positioning (centered in viewport)
    "w-[90%] left-1/2 -translate-x-1/2",
    // Desktop sizing and positioning (centered in main content area)
    // Formula: 50% + (sidebarWidth/2)
    // The sidebar is 16rem (64) wide, so we offset by 8rem
    "lg:w-[600px] lg:left-[calc(50%+8rem)]",
    // Appearance
    "text-zinc-950 antialiased",
    "bg-zinc-100 dark:bg-zinc-800 dark:text-white",
    // Outline
    "outline outline-1 outline-zinc-200 dark:outline-zinc-700 shadow-sm",
    // Padding
    "px-3",
    // Transition
    "transition-all duration-300 ease-in-out",
    // Custom class
    className
  );

  // Base classes for action buttons
  const buttonBaseClasses = clsx(
    // Base
    "flex items-center justify-center",
    // Shape
    "rounded-full",
    // Size - keep circular since we're only showing icons
    "w-9 h-9",
    // Spacing
    "mx-1",
    // Appearance
    theme === "light" ? "bg-zinc-300 text-black" : "bg-zinc-700 text-zinc-100",
    // Transition
    "transition-all duration-200 ease-in-out",
    // Interactive
    "active:scale-95",
    // Tooltip on hover
    "group relative"
  );

  // Additional styles for transparent pencil button
  const pencilButtonClasses = clsx(
    // Base
    "flex items-center justify-center",
    // Shape
    "rounded-full",
    // Size - keep circular since we're only showing icons
    "w-5 h-5",
    // Spacing
    "mx-1",
    // Appearance - Transparent background
    "bg-transparent",
    // Transition
    "transition-all duration-200 ease-in-out",
    // Interactive
    "active:scale-95",
    // Tooltip on hover
    "group relative"
  );

  return (
    <div className={containerClasses}>
      {/* Label/Placeholder */}
      <div
        className={`${
          theme === "light" ? "text-[#2E3A3F]" : "text-white"
        } text-base font-medium ml-2`}
      >
        Add Update
      </div>

      {/* Action Buttons */}
      <div className="flex items-center">
        {/* Text Input Button
        <button
          onClick={onTextClick}
          className={pencilButtonClasses}
          aria-label="Text Input"
          title="Text Input"
        >
          <StyledPencilIcon className="flex-shrink-0" theme={theme} />
          <span
            className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium ${
              theme === "light"
                ? "bg-[#E0E0E0] text-[#2E3A3F]"
                : "bg-[#424242] text-white"
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
          >
            Text Input
          </span>
        </button>

        {/* Add spacing between buttons */}
        {/* <div className="w-2"></div>  */}

        {/* Voice Input Button */}
        <button
          onClick={onVoiceClick}
          className={buttonBaseClasses}
          aria-label="Voice Input"
          title="Voice Input"
        >
          <WaveformIcon />
          <span
            className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-medium ${
              theme === "light"
                ? "bg-[#E0E0E0] text-[#2E3A3F]"
                : "bg-[#424242] text-white"
            } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
          >
            Voice Input
          </span>
        </button>
      </div>
    </div>
  );
}
