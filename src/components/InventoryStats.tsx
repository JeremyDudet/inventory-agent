// frontend/src/components/InventoryStats.tsx
import React, { useMemo } from 'react';
import { InventoryItem } from './InventoryGrid';

interface InventoryStatsProps {
  items: InventoryItem[];
}

/**
 * InventoryStats component displays key metrics and statistics about inventory
 */
const InventoryStats: React.FC<InventoryStatsProps> = ({ items }) => {
  // Calculate statistics
  const stats = useMemo(() => {
    // Total number of items
    const totalItems = items.length;
    
    // Items below threshold
    const lowStockItems = items.filter(item => 
      item.threshold && item.quantity <= item.threshold
    );
    
    // Critical items (below 25% of threshold)
    const criticalItems = items.filter(item => 
      item.threshold && item.quantity <= item.threshold * 0.25
    );
    
    // Items by category
    const categories = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort categories by count (descending)
    const sortedCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 categories
    
    // Recently updated items (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentlyUpdated = items.filter(item => 
      new Date(item.lastUpdated) > oneDayAgo
    );
    
    return {
      totalItems,
      lowStockItems: lowStockItems.length,
      criticalItems: criticalItems.length,
      topCategories: sortedCategories,
      recentlyUpdated: recentlyUpdated.length
    };
  }, [items]);
  
  // Calculate percentage of items that are low stock
  const lowStockPercentage = Math.round((stats.lowStockItems / stats.totalItems) * 100) || 0;
  
  return (
    <div className="bg-base-100 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-4">Inventory Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Items */}
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Total Items</div>
          <div className="stat-value text-2xl">{stats.totalItems}</div>
        </div>
        
        {/* Low Stock Items */}
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Low Stock</div>
          <div className="stat-value text-2xl text-warning">{stats.lowStockItems}</div>
          <div className="stat-desc text-xs">{lowStockPercentage}% of inventory</div>
        </div>
        
        {/* Critical Items */}
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Critical</div>
          <div className="stat-value text-2xl text-error">{stats.criticalItems}</div>
        </div>
        
        {/* Recently Updated */}
        <div className="stat bg-base-200 rounded-lg p-3">
          <div className="stat-title text-xs">Updated (24h)</div>
          <div className="stat-value text-2xl">{stats.recentlyUpdated}</div>
        </div>
      </div>
      
      {/* Top Categories */}
      <div>
        <h4 className="text-sm font-medium mb-2">Top Categories</h4>
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Items</th>
              </tr>
            </thead>
            <tbody>
              {stats.topCategories.map(([category, count]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td className="text-right">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryStats; 