import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

// Import our components
import InventoryGrid, { InventoryItem } from '../components/InventoryGrid';
import InventoryFilter from '../components/InventoryFilter';
import InventoryModal from '../components/InventoryModal';
import ThemeSwitcher from '../components/ThemeSwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import RecentUpdates, { InventoryUpdate } from '../components/RecentUpdates';

// Lazy load voice components
const VoiceControl = lazy(() => import('../components/VoiceControl'));
const FallbackInput = lazy(() => import('../components/FallbackInput'));

// Mock inventory data
const mockInventoryItems: InventoryItem[] = [
  { 
    id: '1', 
    name: 'Coffee Beans (Dark Roast)', 
    quantity: 25, 
    unit: 'pounds', 
    category: 'Beans',
    threshold: 10,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '2', 
    name: 'Coffee Beans (Medium Roast)', 
    quantity: 18, 
    unit: 'pounds', 
    category: 'Beans',
    threshold: 10,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '3', 
    name: 'Whole Milk', 
    quantity: 12, 
    unit: 'gallons', 
    category: 'Dairy',
    threshold: 5,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '4', 
    name: 'Almond Milk', 
    quantity: 8, 
    unit: 'gallons', 
    category: 'Dairy',
    threshold: 3,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '5', 
    name: 'Sugar', 
    quantity: 30, 
    unit: 'pounds', 
    category: 'Sweeteners',
    threshold: 10,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '6', 
    name: 'Vanilla Syrup', 
    quantity: 5, 
    unit: 'bottles', 
    category: 'Syrups',
    threshold: 2,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '7', 
    name: 'Caramel Syrup', 
    quantity: 4, 
    unit: 'bottles', 
    category: 'Syrups',
    threshold: 2,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '8', 
    name: 'Chocolate Syrup', 
    quantity: 3, 
    unit: 'bottles', 
    category: 'Syrups',
    threshold: 2,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '9', 
    name: 'Paper Cups (12oz)', 
    quantity: 500, 
    unit: 'pieces', 
    category: 'Supplies',
    threshold: 100,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: '10', 
    name: 'Paper Cups (16oz)', 
    quantity: 350, 
    unit: 'pieces', 
    category: 'Supplies',
    threshold: 100,
    lastUpdated: new Date().toISOString()
  }
];

// Mock recent updates
const mockRecentUpdates: InventoryUpdate[] = [
  {
    id: '1',
    itemName: 'Coffee Beans (Dark Roast)',
    action: 'add',
    quantity: 10,
    unit: 'pounds',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    userId: 'user1',
    userName: 'John Doe'
  },
  {
    id: '2',
    itemName: 'Whole Milk',
    action: 'remove',
    quantity: 2,
    unit: 'gallons',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    userId: 'user2',
    userName: 'Jane Smith'
  },
  {
    id: '3',
    itemName: 'Paper Cups (12oz)',
    action: 'set',
    quantity: 500,
    unit: 'pieces',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    userId: 'user1',
    userName: 'John Doe'
  },
  {
    id: '4',
    itemName: 'Vanilla Syrup',
    action: 'add',
    quantity: 3,
    unit: 'bottles',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    userId: 'user3',
    userName: 'Alex Johnson'
  },
  {
    id: '5',
    itemName: 'Sugar',
    action: 'remove',
    quantity: 5,
    unit: 'pounds',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    userId: 'user2',
    userName: 'Jane Smith'
  }
];

// User interface
interface User {
  email: string;
  name: string;
  role: string;
}

/**
 * Dashboard component is the main page of the application
 * It displays inventory items and provides controls for managing them
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventoryItems);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Voice control state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  
  // Recent updates state
  const [recentUpdates, setRecentUpdates] = useState<InventoryUpdate[]>(mockRecentUpdates);
  
  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // In a real app, this would be an API call
        const userJson = localStorage.getItem('user');
        
        if (!userJson) {
          navigate('/login');
          return;
        }
        
        const userData = JSON.parse(userJson);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [navigate]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  // Toggle voice control
  const toggleVoiceControl = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      setShowFallback(false);
    } else {
      setIsVoiceActive(true);
      setShowFallback(false);
    }
  };
  
  // Handle voice recognition failure
  const handleVoiceFailure = () => {
    setIsVoiceActive(false);
    setShowFallback(true);
    addNotification('warning', 'Voice recognition failed. Please use the manual input form.');
  };
  
  // Handle inventory update from voice or fallback
  const handleInventoryUpdate = (update: { item: string; action: string; quantity: number; unit: string }) => {
    // Find the item in inventory
    const itemIndex = inventory.findIndex(
      (item) => item.name.toLowerCase() === update.item.toLowerCase()
    );
    
    if (itemIndex >= 0) {
      // Update existing item
      const updatedInventory = [...inventory];
      const item = { ...updatedInventory[itemIndex] };
      
      switch (update.action) {
        case 'add':
          item.quantity += update.quantity;
          break;
        case 'remove':
          item.quantity = Math.max(0, item.quantity - update.quantity);
          break;
        case 'set':
          item.quantity = update.quantity;
          break;
      }
      
      item.lastUpdated = new Date().toISOString();
      updatedInventory[itemIndex] = item;
      setInventory(updatedInventory);
      
      // Add to recent updates
      const newUpdate: InventoryUpdate = {
        id: Date.now().toString(),
        itemName: item.name,
        action: update.action as 'add' | 'remove' | 'set',
        quantity: update.quantity,
        unit: update.unit,
        timestamp: new Date().toISOString(),
        userId: user?.email || 'unknown',
        userName: user?.name || 'Unknown User'
      };
      
      setRecentUpdates([newUpdate, ...recentUpdates]);
      
      // Show notification
      addNotification(
        'success',
        `Successfully ${update.action}ed ${update.quantity} ${update.unit} of ${update.item}`
      );
    } else {
      // Item not found
      addNotification('error', `Item "${update.item}" not found in inventory`);
    }
  };
  
  // Handle item selection for modal
  const handleItemSelect = (id: string) => {
    const item = inventory.find((item) => item.id === id);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };
  
  // Handle save item from modal
  const handleSaveItem = (updatedItem: InventoryItem) => {
    const updatedInventory = inventory.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    
    setInventory(updatedInventory);
    setIsModalOpen(false);
    setSelectedItem(null);
    
    addNotification('success', `Successfully updated ${updatedItem.name}`);
  };
  
  // Handle filter change
  const handleFilterChange = (category: string | undefined) => {
    setFilterCategory(category);
  };
  
  // Handle search change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };
  
  // Get unique categories from inventory
  const categories = Array.from(new Set(inventory.map(item => item.category)));
  
  // If still loading, show spinner
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }
  
  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary">Inventory Agent</h1>
            
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              
              {user && (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-10">
                      <span>{user.name.charAt(0)}</span>
                    </div>
                  </label>
                  <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                    <li className="p-2 text-sm">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs opacity-60">{user.role}</div>
                      </div>
                    </li>
                    <div className="divider my-0"></div>
                    <li><a onClick={handleLogout}>Logout</a></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
            {/* Voice control section */}
            <div className="bg-base-100 rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Voice Control</h2>
                <button 
                  className={`btn btn-sm ${isVoiceActive ? 'btn-error' : 'btn-primary'}`}
                  onClick={toggleVoiceControl}
                >
                  {isVoiceActive ? 'Stop Listening' : 'Start Listening'}
                </button>
              </div>
              
              <Suspense fallback={<LoadingSpinner size="sm" text="Loading voice control..." />}>
                <div style={{ display: isVoiceActive ? 'block' : 'none' }}>
                  <VoiceControl 
                    onUpdate={handleInventoryUpdate}
                    onFailure={handleVoiceFailure}
                  />
                </div>
              </Suspense>
              
              {showFallback && (
                <Suspense fallback={<LoadingSpinner size="sm" text="Loading fallback input..." />}>
                  <FallbackInput onUpdate={handleInventoryUpdate} />
                </Suspense>
              )}
              
              {!isVoiceActive && !showFallback && (
                <div className="text-center py-6 text-base-content/70">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <p>Click "Start Listening" to use voice commands</p>
                  <p className="text-sm mt-2">or</p>
                  <button 
                    className="btn btn-outline btn-sm mt-2"
                    onClick={() => setShowFallback(true)}
                  >
                    Use Manual Input
                  </button>
                </div>
              )}
            </div>
            
            {/* Recent updates section */}
            <RecentUpdates updates={recentUpdates} />
          </div>
          
          {/* Main inventory section */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            <h2 className="text-2xl font-bold mb-4">Inventory Dashboard</h2>
            
            {/* Filters */}
            <InventoryFilter 
              categories={categories}
              onFilterChange={handleFilterChange}
              onSearchChange={handleSearchChange}
            />
            
            {/* Inventory grid */}
            <InventoryGrid 
              items={inventory}
              onItemSelect={handleItemSelect}
              filterCategory={filterCategory}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      </main>
      
      {/* Inventory modal */}
      <InventoryModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default Dashboard; 