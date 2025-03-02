import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { createClient } from '@supabase/supabase-js';
import InventoryGrid, { InventoryItem } from '../components/InventoryGrid';
import LoadingSpinner from '../components/LoadingSpinner';

const VoiceControl = lazy(() => import('../components/VoiceControl'));

// Supabase setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  useEffect(() => {
    const loadUserAndInventory = async () => {
      try {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          navigate('/login');
          return;
        }
        setUser(JSON.parse(userJson));

        const fetchedInventory = await fetchInventory();
        setInventory(fetchedInventory);
      } catch (error) {
        console.error('Error loading data:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndInventory();
  }, [navigate]);

  const fetchInventory = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      addNotification('error', 'Failed to load inventory');
      return [];
    }

    return data.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      threshold: item.threshold,
      lastUpdated: item.last_updated,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleVoiceControl = () => {
    setIsVoiceActive(!isVoiceActive);
  };

  const handleVoiceFailure = () => {
    setIsVoiceActive(false);
    addNotification('warning', 'Voice recognition failed.');
  };

  const handleInventoryUpdate = async (update: { item: string; action: string; quantity: number; unit: string }) => {
    try {
      const { data: items, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .ilike('name', `%${update.item}%`)
        .limit(1);

      if (fetchError) throw fetchError;
      if (!items || items.length === 0) {
        addNotification('error', `Item "${update.item}" not found`);
        return;
      }

      const item = items[0];
      let newQuantity: number;

      switch (update.action.toLowerCase()) {
        case 'add':
          newQuantity = item.quantity + update.quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, item.quantity - update.quantity);
          break;
        case 'set':
          newQuantity = update.quantity;
          break;
        default:
          addNotification('error', `Unknown action: ${update.action}`);
          return;
      }

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          unit: update.unit,
          last_updated: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Refresh inventory
      const updatedInventory = await fetchInventory();
      setInventory(updatedInventory);
      addNotification('success', `${update.action}ed ${update.quantity} ${update.unit} of ${item.name}`);
    } catch (error) {
      console.error('Error updating inventory:', error);
      addNotification('error', 'Failed to update inventory');
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen text="Loading..." />;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="bg-base-100 shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Inventory Agent</h1>
          <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <button onClick={toggleVoiceControl} className="btn btn-primary mb-4">
          {isVoiceActive ? 'Hide Voice Control' : 'Show Voice Control'}
        </button>

        {isVoiceActive && (
          <Suspense fallback={<LoadingSpinner size="sm" text="Loading voice control..." />}>
            <VoiceControl onUpdate={handleInventoryUpdate} onFailure={handleVoiceFailure} />
          </Suspense>
        )}

        <InventoryGrid items={inventory} onItemSelect={() => {}} filterCategory={undefined} searchTerm="" />
      </main>
    </div>
  );
};

export default Dashboard;