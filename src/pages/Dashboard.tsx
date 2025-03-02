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
const MicrophoneTest = lazy(() => import('../components/MicrophoneTest'));

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
    // Find the item in inventory, using fuzzy matching for more flexible item recognition
    const itemIndex = findItemByName(update.item);
    
    if (itemIndex >= 0) {
      // Update existing item
      const updatedInventory = [...inventory];
      const item = { ...updatedInventory[itemIndex] };
      
      // Handle different action types
      switch (update.action) {
        case 'add':
          item.quantity += update.quantity;
          addNotification(
            'success',
            `Added ${update.quantity} ${update.unit} of ${item.name}`
          );
          break;
          
        case 'remove':
          const newQuantity = Math.max(0, item.quantity - update.quantity);
          // Warn if trying to remove more than available
          if (item.quantity < update.quantity) {
            addNotification(
              'warning',
              `Could only remove ${item.quantity} ${update.unit} of ${item.name} (requested ${update.quantity})`
            );
          } else {
            addNotification(
              'success',
              `Removed ${update.quantity} ${update.unit} of ${item.name}`
            );
          }
          item.quantity = newQuantity;
          break;
          
        case 'set':
          item.quantity = update.quantity;
          addNotification(
            'success',
            `Set ${item.name} to ${update.quantity} ${update.unit}`
          );
          break;
          
        case 'check':
          // For check commands, just show the current quantity without modifying
          addNotification(
            'info',
            `Current inventory of ${item.name}: ${item.quantity} ${item.unit}`
          );
          // Exit early without updating inventory
          return;
          
        default:
          // Unknown action
          addNotification(
            'error',
            `Unknown action "${update.action}". Supported actions: add, remove, set, check`
          );
          return;
      }
      
      // Update the inventory item
      item.lastUpdated = new Date().toISOString();
      updatedInventory[itemIndex] = item;
      setInventory(updatedInventory);
      
      // Add to recent updates (only for actions that change inventory)
      if (update.action !== 'check') {
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
      }
    } else {
      // Item not found - give a helpful message with fuzzy match suggestions
      const similarItems = findSimilarItems(update.item);
      
      if (similarItems.length > 0) {
        const suggestions = similarItems.map(i => i.name).join(', ');
        addNotification(
          'warning', 
          `Item "${update.item}" not found. Did you mean: ${suggestions}?`
        );
      } else {
        // No similar items found
        addNotification(
          'error', 
          `Item "${update.item}" not found in inventory`
        );
      }
    }
  };
  
  // Find an item by name with some flexibility in matching
  const findItemByName = (itemName: string): number => {
    const lowerName = itemName.toLowerCase().trim();
    
    // First try exact match
    const exactMatch = inventory.findIndex(
      (item) => item.name.toLowerCase() === lowerName
    );
    
    if (exactMatch >= 0) {
      return exactMatch;
    }
    
    // Then try contains match (for partial names)
    const containsMatch = inventory.findIndex(
      (item) => item.name.toLowerCase().includes(lowerName) || 
               lowerName.includes(item.name.toLowerCase())
    );
    
    if (containsMatch >= 0) {
      return containsMatch;
    }
    
    // Then try word match (for when words are in different order)
    const itemWords = lowerName.split(/\s+/);
    const wordMatch = inventory.findIndex(item => {
      const nameWords = item.name.toLowerCase().split(/\s+/);
      // At least half of the words should match
      const matchingWords = nameWords.filter(word => itemWords.includes(word));
      return matchingWords.length >= Math.min(2, Math.ceil(nameWords.length / 2));
    });
    
    return wordMatch;
  };
  
  // Find similar items for suggestions
  const findSimilarItems = (itemName: string, limit = 3): InventoryItem[] => {
    const lowerName = itemName.toLowerCase().trim();
    const itemWords = lowerName.split(/\s+/);
    
    // Calculate similarity scores for each inventory item
    const scoredItems = inventory.map(item => {
      const nameWords = item.name.toLowerCase().split(/\s+/);
      
      // Count matching words
      const matchingWords = nameWords.filter(word => itemWords.includes(word));
      const wordScore = matchingWords.length / Math.max(nameWords.length, itemWords.length);
      
      // Check for substring matches
      const substringScore = lowerName.includes(item.name.toLowerCase()) || 
                            item.name.toLowerCase().includes(lowerName) ? 0.5 : 0;
      
      return {
        item,
        score: wordScore + substringScore
      };
    });
    
    // Sort by score and return top matches
    return scoredItems
      .filter(item => item.score > 0) // Only return items with some similarity
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.item);
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
            <div className="bg-base-100 rounded-lg shadow-md p-4 mb-4">
              <div className="tabs tabs-boxed mb-4">
                <button 
                  className={`tab ${!showFallback && isVoiceActive ? 'tab-active' : ''}`}
                  onClick={() => {
                    setShowFallback(false);
                    if (!isVoiceActive) toggleVoiceControl();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Voice Input
                </button>
                <button 
                  className={`tab ${showFallback ? 'tab-active' : ''}`}
                  onClick={() => {
                    setIsVoiceActive(false);
                    setShowFallback(true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Manual Input
                </button>
                <button 
                  className={`tab ${!showFallback && !isVoiceActive ? 'tab-active' : ''}`}
                  onClick={() => {
                    setIsVoiceActive(false);
                    setShowFallback(false);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Mic Test
                </button>
              </div>
              
              {/* Voice Control Component */}
              <Suspense fallback={<LoadingSpinner size="sm" text="Loading voice control..." />}>
                <div style={{ display: isVoiceActive && !showFallback ? 'block' : 'none' }}>
                  <VoiceControl 
                    onUpdate={handleInventoryUpdate}
                    onFailure={handleVoiceFailure}
                  />
                </div>
              </Suspense>
              
              {/* Fallback Input Component */}
              {showFallback && (
                <Suspense fallback={<LoadingSpinner size="sm" text="Loading fallback input..." />}>
                  <FallbackInput onUpdate={handleInventoryUpdate} />
                </Suspense>
              )}
              
              {/* Microphone Test Component */}
              {!isVoiceActive && !showFallback && (
                <Suspense fallback={<LoadingSpinner size="sm" text="Loading microphone test..." />}>
                  <MicrophoneTest />
                </Suspense>
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