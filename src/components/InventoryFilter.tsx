import React, { useState, useEffect } from 'react';

interface InventoryFilterProps {
  categories: string[];
  onFilterChange: (category: string | undefined) => void;
  onSearchChange: (searchTerm: string) => void;
}

/**
 * InventoryFilter component provides search and category filtering
 * for inventory items
 */
const InventoryFilter: React.FC<InventoryFilterProps> = ({
  categories,
  onFilterChange,
  onSearchChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle category selection
  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category);
    onFilterChange(category);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSearchTerm('');
    onFilterChange(undefined);
    onSearchChange('');
  };

  return (
    <div className="bg-base-100 shadow-md rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="form-control w-full md:w-1/3">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search inventory..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button 
                className="btn btn-square" 
                onClick={() => {
                  setSearchTerm('');
                  onSearchChange('');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category filter on mobile */}
        <div className="md:hidden">
          <button 
            className="btn btn-outline w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {selectedCategory || 'Filter by Category'}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleCategoryChange(undefined)}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter on desktop */}
        <div className="hidden md:flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleCategoryChange(undefined)}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Clear filters button */}
        {(selectedCategory || searchTerm) && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default InventoryFilter; 