/**
 * API service for making calls to the backend
 */

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Types
interface LoginCredentials {
  username: string;
  password: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: string;
  };
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface InventoryUpdateRequest {
  item: string;
  action: 'add' | 'remove' | 'set';
  quantity: number;
  unit: string;
}

// Helper function for making API requests
const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  token?: string
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// API functions
export const api = {
  // Auth
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/api/login', 'POST', credentials);
  },

  // Inventory
  getInventory: async (token: string): Promise<InventoryItem[]> => {
    return apiRequest<InventoryItem[]>('/api/inventory', 'GET', undefined, token);
  },

  updateInventory: async (update: InventoryUpdateRequest, token: string): Promise<InventoryItem> => {
    return apiRequest<InventoryItem>('/api/inventory/update', 'POST', update, token);
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    return apiRequest<{ status: string }>('/health');
  },
};

export default api; 