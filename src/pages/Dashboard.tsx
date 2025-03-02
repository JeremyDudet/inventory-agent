import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import InventoryGrid, { InventoryItem } from '../components/InventoryGrid';
import InventoryFilter from '../components/InventoryFilter';
import InventoryModal from '../components/InventoryModal';
import ThemeSwitcher from '../components/ThemeSwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import RecentUpdates, { InventoryUpdate } from '../components/RecentUpdates';

const VoiceControl = lazy(() => import('../components/VoiceControl'));
const FallbackInput = lazy(() => import('../components/FallbackInput'));
const MicrophoneTest = lazy(() => import('../components/MicrophoneTest'));

const mockInventoryItems: InventoryItem[] = [
  { id: '1', name: 'Coffee Beans (Dark Roast)', quantity: 25, unit: 'pounds', category: 'Beans', threshold: 10, lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Whole Milk', quantity: 12, unit: 'gallons', category: 'Dairy', threshold: 5, lastUpdated: new Date().toISOString() },
];

const mockRecentUpdates: InventoryUpdate[] = [
  { id: '1', itemName: 'Coffee Beans (Dark Roast)', action: 'add', quantity: 10, unit: 'pounds', timestamp: new Date().toISOString(), userId: 'user1', userName: 'John Doe' },
];

interface User {
  email: string;
  name: string;
  role: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventoryItems);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<InventoryUpdate[]>(mockRecentUpdates);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          navigate('/login');
          return;
        }
        setUser(JSON.parse(userJson));
      } catch (error) {
        console.error('Error loading user:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleVoiceControl = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      setShowFallback(false);
    } else {
      setIsVoiceActive(true);
      setShowFallback(false);
    }
  };

  const handleVoiceFailure = () => {
    setIsVoiceActive(false);
    setShowFallback(true);
    addNotification('warning', 'Voice recognition failed. Use manual input.');
  };

  const handleInventoryUpdate = (update: { item: string; action: string; quantity: number; unit: string }) => {
    const itemIndex = inventory.findIndex(i => i.name.toLowerCase().includes(update.item.toLowerCase()));
    if (itemIndex >= 0) {
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
      const newUpdate: InventoryUpdate = {
        id: Date.now().toString(),
        itemName: item.name,
        action: update.action as 'add' | 'remove' | 'set',
        quantity: update.quantity,
        unit: update.unit,
        timestamp: new Date().toISOString(),
        userId: user?.email || 'unknown',
        userName: user?.name || 'Unknown',
      };
      setRecentUpdates([newUpdate, ...recentUpdates]);
      addNotification('success', `${update.action}ed ${update.quantity} ${update.unit} of ${item.name}`);
    } else {
      addNotification('error', `Item "${update.item}" not found`);
    }
  };

  const handleItemSelect = (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveItem = (updatedItem: InventoryItem) => {
    setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
    setIsModalOpen(false);
    setSelectedItem(null);
    addNotification('success', `Updated ${updatedItem.name}`);
  };

  const handleFilterChange = (category: string | undefined) => setFilterCategory(category);
  const handleSearchChange = (term: string) => setSearchTerm(term);

  const categories = Array.from(new Set(inventory.map(item => item.category)));

  if (isLoading) return <LoadingSpinner fullScreen text="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="bg-base-100 shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
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
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
            <div className="bg-base-100 rounded-lg shadow-md p-4 mb-4">
              <div className="tabs tabs-boxed mb-4">
                <button
                  className={`tab ${!showFallback && isVoiceActive ? 'tab-active' : ''}`}
                  onClick={() => { setShowFallback(false); if (!isVoiceActive) toggleVoiceControl(); }}
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                  Voice Input
                </button>
                <button
                  className={`tab ${showFallback ? 'tab-active' : ''}`}
                  onClick={() => { setIsVoiceActive(false); setShowFallback(true); }}
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                  Manual Input
                </button>
                <button
                  className={`tab ${!showFallback && !isVoiceActive ? 'tab-active' : ''}`}
                  onClick={() => { setIsVoiceActive(false); setShowFallback(false); }}
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                  Mic Test
                </button>
              </div>

              <Suspense fallback={<LoadingSpinner size="sm" text="Loading..." />}>
                <div style={{ display: isVoiceActive && !showFallback ? 'block' : 'none' }}>
                  <VoiceControl onUpdate={handleInventoryUpdate} onFailure={handleVoiceFailure} />
                </div>
              </Suspense>

              {showFallback && (
                <Suspense fallback={<LoadingSpinner size="sm" text="Loading..." />}>
                  <FallbackInput onUpdate={handleInventoryUpdate} />
                </Suspense>
              )}

              {!isVoiceActive && !showFallback && (
                <Suspense fallback={<LoadingSpinner size="sm" text="Loading..." />}>
                  <MicrophoneTest />
                </Suspense>
              )}
            </div>

            <RecentUpdates updates={recentUpdates} />
          </div>

          <div className="w-full lg:w-2/3 xl:w-3/4">
            <h2 className="text-2xl font-bold mb-4">Inventory Dashboard</h2>
            <InventoryFilter categories={categories} onFilterChange={handleFilterChange} onSearchChange={handleSearchChange} />
            <InventoryGrid items={inventory} onItemSelect={handleItemSelect} filterCategory={filterCategory} searchTerm={searchTerm} />
          </div>
        </div>
      </main>

      <InventoryModal item={selectedItem} isOpen={isModalOpen} onClose={handleModalClose} onSave={handleSaveItem} />
    </div>
  );
};

export default Dashboard;