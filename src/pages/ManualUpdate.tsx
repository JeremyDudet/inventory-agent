import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManualUpdate.css';

interface User {
  username: string;
  role: string;
  token: string;
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

const ManualUpdate: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | ''>('');
  const [action, setAction] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(storedUser));
    
    // TODO: Fetch actual inventory data from API
    // For now, using mock data
    const mockInventoryItems = [
      { id: 1, name: 'Coffee Beans (Dark Roast)', quantity: 25, unit: 'pounds', category: 'Beans' },
      { id: 2, name: 'Coffee Beans (Medium Roast)', quantity: 18, unit: 'pounds', category: 'Beans' },
      { id: 3, name: 'Whole Milk', quantity: 12, unit: 'gallons', category: 'Dairy' },
      { id: 4, name: 'Almond Milk', quantity: 8, unit: 'gallons', category: 'Dairy' },
      { id: 5, name: 'Oat Milk', quantity: 6, unit: 'gallons', category: 'Dairy' },
      { id: 6, name: 'Sugar', quantity: 30, unit: 'pounds', category: 'Sweeteners' },
      { id: 7, name: 'Vanilla Syrup', quantity: 5, unit: 'bottles', category: 'Syrups' },
      { id: 8, name: 'Caramel Syrup', quantity: 4, unit: 'bottles', category: 'Syrups' },
      { id: 9, name: 'To-Go Cups (12oz)', quantity: 250, unit: 'cups', category: 'Supplies' },
      { id: 10, name: 'To-Go Cups (16oz)', quantity: 200, unit: 'cups', category: 'Supplies' },
    ];
    setInventory(mockInventoryItems);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItem === '') {
      setError('Please select an item');
      return;
    }
    
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Find the selected item
      const item = inventory.find(item => item.id === Number(selectedItem));
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Create a copy of the inventory
      const updatedInventory = [...inventory];
      const itemIndex = updatedInventory.findIndex(i => i.id === Number(selectedItem));
      
      // Update the quantity based on the action
      if (action === 'add') {
        updatedInventory[itemIndex].quantity += quantity;
      } else if (action === 'remove') {
        updatedInventory[itemIndex].quantity = Math.max(0, updatedInventory[itemIndex].quantity - quantity);
      } else if (action === 'set') {
        updatedInventory[itemIndex].quantity = quantity;
      }
      
      // TODO: Send update to API
      // Mock API call for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setInventory(updatedInventory);
      
      // Show success message
      setSuccess(`Successfully ${action}ed ${quantity} ${item.unit} of ${item.name}`);
      
      // Reset form
      setSelectedItem('');
      setQuantity(1);
      setAction('add');
    } catch (err) {
      setError('Failed to update inventory');
      console.error('Update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="manual-update-container">
      <header className="manual-update-header">
        <h1>Manual Inventory Update</h1>
        <div className="user-info">
          <span>Logged in as: <strong>{user.username}</strong> ({user.role})</span>
        </div>
      </header>
      
      <div className="manual-update-content">
        <div className="form-container">
          <h2>Update Inventory</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="item">Select Item</label>
              <select
                id="item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value ? Number(e.target.value) : '')}
                disabled={isLoading}
              >
                <option value="">Select an item</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="action">Action</label>
              <select
                id="action"
                value={action}
                onChange={(e) => setAction(e.target.value as 'add' | 'remove' | 'set')}
                disabled={isLoading}
              >
                <option value="add">Add</option>
                <option value="remove">Remove</option>
                <option value="set">Set</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="update-button"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Inventory'}
              </button>
              
              <button 
                type="button" 
                className="back-button"
                onClick={handleBackToDashboard}
                disabled={isLoading}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
        
        <div className="inventory-preview">
          <h2>Current Inventory</h2>
          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} className={Number(selectedItem) === item.id ? 'selected-row' : ''}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td className={item.quantity < 10 ? 'low-stock' : ''}>{item.quantity}</td>
                    <td>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualUpdate; 