import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';

export interface InventoryUpdate {
  id: string;
  itemName: string;
  action: 'add' | 'remove' | 'set';
  quantity: number;
  unit: string;
  timestamp: string;
  userId: string;
  userName: string;
}

interface RecentUpdatesProps {
  updates: InventoryUpdate[];
  maxItems?: number;
}

/**
 * RecentUpdates component displays a list of recent inventory changes
 * with timestamps and user information
 */
const RecentUpdates: React.FC<RecentUpdatesProps> = ({
  updates,
  maxItems = 5
}) => {
  // Sort updates by timestamp (newest first) and limit to maxItems
  const sortedUpdates = [...updates]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxItems);

  // Format the action text
  const getActionText = (action: string, quantity: number, unit: string, itemName: string) => {
    switch (action) {
      case 'add':
        return `Added ${quantity} ${unit} of ${itemName}`;
      case 'remove':
        return `Removed ${quantity} ${unit} of ${itemName}`;
      case 'set':
        return `Set ${itemName} to ${quantity} ${unit}`;
      default:
        return `Updated ${itemName}`;
    }
  };

  // Get appropriate icon for the action
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
      case 'remove':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'set':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4">Recent Updates</h3>
      
      {sortedUpdates.length === 0 ? (
        <div className="text-center py-4 text-base-content/70">
          <p>No recent updates</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedUpdates.map((update) => (
            <li key={update.id} className="flex items-start gap-3 pb-3 border-b border-base-300 last:border-0">
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(update.action)}
              </div>
              
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium">
                  {getActionText(update.action, update.quantity, update.unit, update.itemName)}
                </p>
                
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-base-content/70">
                    by {update.userName}
                  </span>
                  
                  <span 
                    className="text-xs text-base-content/70"
                    title={format(new Date(update.timestamp), 'PPpp')}
                  >
                    {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {updates.length > maxItems && (
        <div className="text-center mt-4">
          <button className="btn btn-ghost btn-sm">
            View All Updates
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentUpdates; 