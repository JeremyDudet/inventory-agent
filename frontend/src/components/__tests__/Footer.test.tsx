import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  it('renders copyright notice with current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    const copyrightText = screen.getByText(new RegExp(currentYear.toString()));
    expect(copyrightText).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<Footer />);
    
    // Check for footer element with correct classes
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-gray-800', 'text-white', 'fixed', 'bottom-0', 'w-full');
    
    // Check for container with correct classes
    const container = footer.querySelector('.container');
    expect(container).toHaveClass('mx-auto');
  });

  it('renders with correct text content', () => {
    render(<Footer />);
    const text = screen.getByText(/Inventory Management System/i);
    expect(text).toBeInTheDocument();
  });
}); 