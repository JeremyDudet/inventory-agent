// frontend/src/components/InventoryModal.tsx
import React, { useState, useEffect } from 'react';
import { InventoryItem } from './InventoryGrid';

interface InventoryModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

/**
 * InventoryModal component for viewing and updating inventory items
 */
const InventoryModal: React.FC<InventoryModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setErrors({});
    }
  }, [item]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Convert number inputs to numbers
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required';
    }
    
    if (formData.quantity === undefined || formData.quantity === null) {
      newErrors.quantity = 'Quantity is required';
    } else if (typeof formData.quantity === 'number' && formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    
    if (!formData.unit || formData.unit.trim() === '') {
      newErrors.unit = 'Unit is required';
    }
    
    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Category is required';
    }
    
    if (formData.threshold !== undefined && typeof formData.threshold === 'number' && formData.threshold < 0) {
      newErrors.threshold = 'Threshold cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && item) {
      onSave({
        ...item,
        ...formData,
        lastupdated: new Date().toISOString()
      } as InventoryItem);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg text-primary">
          {item.id ? 'Update Inventory Item' : 'Add New Inventory Item'}
        </h3>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Item Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter item name"
              />
              {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
            </div>
            
            {/* Category field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.category ? 'input-error' : ''}`}
                placeholder="Enter category"
              />
              {errors.category && <span className="text-error text-xs mt-1">{errors.category}</span>}
            </div>
            
            {/* Quantity field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Quantity</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity === undefined ? '' : formData.quantity}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.quantity ? 'input-error' : ''}`}
                placeholder="Enter quantity"
                min="0"
                step="0.01"
              />
              {errors.quantity && <span className="text-error text-xs mt-1">{errors.quantity}</span>}
            </div>
            
            {/* Unit field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Unit</span>
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit || ''}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.unit ? 'input-error' : ''}`}
                placeholder="Enter unit (e.g., kg, lbs, pcs)"
              />
              {errors.unit && <span className="text-error text-xs mt-1">{errors.unit}</span>}
            </div>
            
            {/* Threshold field */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Reorder Threshold (Optional)</span>
              </label>
              <input
                type="number"
                name="threshold"
                value={formData.threshold === undefined ? '' : formData.threshold}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.threshold ? 'input-error' : ''}`}
                placeholder="Enter threshold quantity"
                min="0"
                step="0.01"
              />
              {errors.threshold && <span className="text-error text-xs mt-1">{errors.threshold}</span>}
              <label className="label">
                <span className="label-text-alt">System will alert when inventory falls below this level</span>
              </label>
            </div>
          </div>
          
          <div className="modal-action mt-6">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal; 