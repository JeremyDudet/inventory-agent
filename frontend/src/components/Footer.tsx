// frontend/src/components/Footer.tsx
// This is where we will add the user input control (voice and text) and system actions.
// I want it to be a fixed bottom footer that is always visible.

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white fixed bottom-0 w-full p-4" role="contentinfo">
      <div className="container mx-auto">
        <p className="text-center">
          &copy; {new Date().getFullYear()} Inventory Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
