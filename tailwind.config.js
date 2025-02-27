/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom color extensions can go here if needed
      colors: {
        // Example of custom brand colors
        'brand-primary': '#4a6cf7',
        'brand-secondary': '#f97316',
      },
      // Custom spacing, fonts, etc. can be added here
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    styled: true,
    themes: [
      {
        light: {
          "primary": "#4a6cf7",
          "secondary": "#f97316",
          "accent": "#37cdbe",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          "base-200": "#f8f9fa",
          "base-300": "#f0f0f0",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      {
        dark: {
          "primary": "#4a6cf7",
          "secondary": "#f97316",
          "accent": "#37cdbe",
          "neutral": "#191D24",
          "base-100": "#2A303C",
          "base-200": "#242933",
          "base-300": "#20252E",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
    base: true,
    utils: true,
    logs: true,
  },
}; 