// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import InventoryGrid, { InventoryItem } from '../components/InventoryGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import AudioVisualizer from '../components/AudioVisualizer';
import MinimizedAudioVisualizer from '../components/MinimizedAudioVisualizer';
import ThemeToggle from '../components/ThemeToggle';
import supabase from '../config/supabase';

const VoiceControl = lazy(() => import('../components/VoiceControl'));

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
  const [isVoiceMinimized, setIsVoiceMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [voiceControlKey, setVoiceControlKey] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  // Effect to watch listening state changes
  useEffect(() => {
    if (!isListening) {
      // If listening stops, increment the key to refresh the voice control component
      // on the next render when it's not minimized
      setVoiceControlKey(prev => prev + 1);
    }
  }, [isListening]);

  const { user: authUser, signOut } = useAuth();
  
  useEffect(() => {
    const loadUserAndInventory = async () => {
      try {
        if (!authUser) {
          navigate('/login');
          return;
        }
        
        // Set user from Supabase auth
        setUser({
          email: authUser.email || '',
          name: authUser.user_metadata?.name || 'User',
          role: authUser.user_metadata?.role || 'staff'
        });
        
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
  }, [navigate, authUser]);

  const fetchInventory = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('lastupdated', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      addNotification('error', 'Failed to load inventory');
      return [];
    }

    // Log the first item to see the format of lastupdated
    if (data && data.length > 0) {
      console.log('First item lastupdated:', data[0].lastupdated);
      console.log('First item full data:', data[0]);
    }

    return data.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      threshold: item.threshold,
      lastupdated: item.lastupdated,
    }));
  };

  const handleLogout = async () => {
    await signOut();
  };

  const toggleVoiceControl = () => {
    if (isVoiceActive) {
      // If we're recording, don't fully hide - just minimize
      if (isListening) {
        setIsVoiceMinimized(true);
      } else {
        setIsVoiceActive(false);
        setIsVoiceMinimized(false);
      }
    } else {
      // Show voice control
      setIsVoiceActive(true);
      setIsVoiceMinimized(false);
    }
  };

  const maximizeVoiceControl = () => {
    setIsVoiceActive(true);
    setIsVoiceMinimized(false);
  };
  
  // This function is used for the minimized "Stop listening" button
  const stopListening = () => {
    setIsListening(false);
    // We don't directly call any VoiceControl methods here
    // Instead we rely on the state change to propagate to the still-mounted VoiceControl component
  };

  const handleVoiceFailure = () => {
    setIsVoiceActive(false);
    setIsVoiceMinimized(false);
    setIsListening(false);
    addNotification('warning', 'Voice recognition failed.');
  };
  
  const handleListeningStateChange = (listening: boolean, audioStream: MediaStream | null) => {
    setIsListening(listening);
    setStream(audioStream);
  };
  
  const handleConnectionStateChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  const handleInventoryUpdate = async (update: { item: string; itemId?: string; action: string; quantity: number; unit: string }) => {
    try {
      let itemToUpdate;
      
      if (update.itemId) {
        // If itemId is provided, use it directly
        const { data: item, error: fetchError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('id', update.itemId)
          .single();
          
        if (fetchError) throw fetchError;
        itemToUpdate = item;
      } else if (update.item) {
        // If item name is provided, search for it
        const { data: items, error: fetchError } = await supabase
          .from('inventory_items')
          .select('*')
          .ilike('name', `%${update.item}%`)
          .limit(1);

        if (fetchError) throw fetchError;
        if (!items || items.length === 0) {
          addNotification('error', `Item "${update.item}" not found`);
          return;
        }
        
        itemToUpdate = items[0];
      } else {
        addNotification('error', 'No item specified for update');
        return;
      }

      let newQuantity: number;

      switch (update.action.toLowerCase()) {
        case 'add':
          newQuantity = itemToUpdate.quantity + update.quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, itemToUpdate.quantity - update.quantity);
          break;
        case 'set':
          newQuantity = update.quantity;
          break;
        default:
          addNotification('error', `Unknown action: ${update.action}`);
          return;
      }

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity: newQuantity,
          unit: update.unit,
          lastupdated: new Date().toISOString()
        })
        .eq('id', itemToUpdate.id);

      if (updateError) throw updateError;

      // Refresh inventory
      const updatedInventory = await fetchInventory();
      setInventory(updatedInventory);
      addNotification('success', `${update.action}ed ${update.quantity} ${update.unit} of ${itemToUpdate.name}`);
    } catch (error) {
      console.error('Error updating inventory:', error);
      addNotification('error', 'Failed to update inventory');
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen text="Loading..." />;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="bg-base-100 shadow-md transition-colors duration-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">StockCount</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="voice-control-section mb-6 relative">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleVoiceControl} 
              className={`btn ${isVoiceActive ? 'btn-neutral' : 'btn-primary'} rounded-full px-6 flex items-center gap-2`}
            >
              {isVoiceActive ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isListening ? "M19 9l-7 7-7-7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                  {isListening ? 'Minimize' : 'Hide'}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Voice Control
                </>
              )}
            </button>
            
            {/* Recording status indicator */}
            {isListening && (
              <div className={`recording-status flex items-center gap-3 px-4 py-2 rounded-full ${isConnected ? 'bg-success/10' : 'bg-error/10'} border ${isConnected ? 'border-success/30' : 'border-error/30'} shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse ${isConnected ? 'bg-success' : 'bg-error'}`}></span>
                  <span className={`text-sm font-medium ${isConnected ? 'text-success' : 'text-error'}`}>
                    {isConnected ? 'Recording' : 'Connection Error'}
                  </span>
                </div>
                
                {!isVoiceActive && !isVoiceMinimized && (
                  <button 
                    onClick={maximizeVoiceControl} 
                    className="text-sm underline hover:no-underline opacity-70 hover:opacity-100 transition"
                  >
                    Show controls
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Floating indicator with audio visualizer when minimized */}
          {isListening && isVoiceMinimized && (
            <div className="fixed bottom-6 right-6 z-50">
              <div className="bg-base-100 rounded-xl shadow-xl border border-base-300 overflow-hidden flex flex-col w-72">
                {/* Header with controls */}
                <div className="p-3 flex items-center justify-between border-b border-base-200 bg-base-200/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isConnected ? 'bg-success' : 'bg-error'}`}></div>
                    <span className="font-medium text-sm">Voice Recognition Active</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={maximizeVoiceControl} 
                      className="btn btn-ghost btn-xs rounded-full"
                      title="Expand voice control"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6L9 15M5 21H3m0 0v-6m0 6l12-12" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={stopListening} 
                      className="btn btn-error btn-xs rounded-full"
                      title="Stop listening"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Audio visualizer optimized for minimized view */}
                <div className="p-3 h-16 bg-gradient-to-b from-base-200/30 to-transparent">
                  <MinimizedAudioVisualizer 
                    isListening={isListening} 
                    stream={stream}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {isVoiceActive && (
          <Suspense fallback={<LoadingSpinner size="sm" text="Loading voice control..." />}>
            <div 
              className="relative mb-4" 
              style={{display: isVoiceMinimized ? 'none' : 'block'}}
              // Keep the component mounted even when minimized, just hide it visually
            >
              <VoiceControl 
                key={voiceControlKey}
                onUpdate={handleInventoryUpdate} 
                onFailure={handleVoiceFailure} 
                onListeningChange={handleListeningStateChange}
                onConnectionChange={handleConnectionStateChange}
              />
            </div>
          </Suspense>
        )}

        <InventoryGrid items={inventory} onItemSelect={() => {}} filterCategory={undefined} searchTerm="" />
      </main>
    </div>
  );
};

export default Dashboard;