import React, { useState } from 'react';

interface FallbackInputProps {
  onUpdate: (update: { item: string; action: string; quantity: number; unit: string }) => void;
}

/**
 * FallbackInput component provides a text-based alternative
 * for inventory updates when voice recognition fails
 */
const FallbackInput: React.FC<FallbackInputProps> = ({ onUpdate }) => {
  const [action, setAction] = useState<string>('add');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [item, setItem] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Common units for autocomplete
  const commonUnits = ['pounds', 'gallons', 'bottles', 'cups', 'pieces', 'boxes', 'bags', 'cans'];

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!action) {
      newErrors.action = 'Please select an action';
    }
    
    if (!quantity) {
      newErrors.quantity = 'Please enter a quantity';
    } else if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid positive number';
    }
    
    if (!unit) {
      newErrors.unit = 'Please enter a unit';
    }
    
    if (!item) {
      newErrors.item = 'Please enter an item name';
    }
    
    setErrors(newErrors);
    
    // If no errors, submit the update
    if (Object.keys(newErrors).length === 0) {
      onUpdate({
        action,
        quantity: Number(quantity),
        unit,
        item
      });
      
      // Show success message
      setIsSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setQuantity('');
        setUnit('');
        setItem('');
      }, 2000);
    }
  };

  return (
    <div className="mt-4 p-4 bg-base-200 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Manual Inventory Update</h3>
      
      {isSuccess && (
        <div className="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Inventory updated successfully!</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Action</span>
            </label>
            <select 
              className={`select select-bordered w-full ${errors.action ? 'select-error' : ''}`}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="add">Add</option>
              <option value="remove">Remove</option>
              <option value="set">Set</option>
            </select>
            {errors.action && <span className="text-error text-xs mt-1">{errors.action}</span>}
          </div>
          
          {/* Quantity input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Quantity</span>
            </label>
            <input
              type="number"
              className={`input input-bordered w-full ${errors.quantity ? 'input-error' : ''}`}
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="0.01"
            />
            {errors.quantity && <span className="text-error text-xs mt-1">{errors.quantity}</span>}
          </div>
          
          {/* Unit input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Unit</span>
            </label>
            <input
              type="text"
              className={`input input-bordered w-full ${errors.unit ? 'input-error' : ''}`}
              placeholder="Enter unit (e.g., pounds, gallons)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              list="common-units"
            />
            <datalist id="common-units">
              {commonUnits.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
            {errors.unit && <span className="text-error text-xs mt-1">{errors.unit}</span>}
          </div>
          
          {/* Item input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Item</span>
            </label>
            <input
              type="text"
              className={`input input-bordered w-full ${errors.item ? 'input-error' : ''}`}
              placeholder="Enter item name"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
            {errors.item && <span className="text-error text-xs mt-1">{errors.item}</span>}
          </div>
        </div>
        
        <div className="mt-4">
          <button type="submit" className="btn btn-primary w-full">
            Update Inventory
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-base-content/50">
        <p>Example: Add 5 pounds of coffee beans</p>
      </div>
    </div>
  );
};

export default FallbackInput; 