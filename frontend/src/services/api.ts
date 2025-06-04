// frontend/src/services/api.ts
/**
 * API service for making calls to the backend
 */

import { AuthUser } from "@/types";
// API base URL using Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface WaitingListFormData {
  email: string;
  name: string;
  phone: string;
  businessType: string;
  inventoryMethod: string;
  softwareName: string | undefined;
}
interface LoginResponse {
  user: AuthUser;
  token: string;
  sessionId: string;
  message: string;
}

// API Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
  isAuthError?: boolean;
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface InventoryUpdateRequest {
  quantity: number;
}

// Helper function for making API requests
export const apiRequest = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  token?: string
): Promise<T> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Create a custom error object
      const apiError = new Error(
        errorData.error?.message ||
          errorData.message ||
          `API request failed with status ${response.status}`
      ) as ApiError;

      // Add additional error properties
      apiError.status = response.status;
      apiError.code = errorData.error?.code || "API_ERROR";
      apiError.details = errorData.error?.details || errorData.details;

      // Mark auth-related errors
      apiError.isAuthError =
        response.status === 401 ||
        response.status === 403 ||
        apiError.code === "UNAUTHORIZED" ||
        apiError.code === "FORBIDDEN" ||
        apiError.code === "MISSING_TOKEN" ||
        apiError.code === "INVALID_TOKEN" ||
        apiError.message?.includes("Authentication Error") ||
        apiError.message?.includes("Authorization Error");

      throw apiError;
    }

    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// API functions
export const api = {
  // Generic HTTP methods
  get: async (
    endpoint: string,
    config?: { headers?: Record<string, string> }
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...config?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`GET request failed: ${response.statusText}`);
    }

    return response.json();
  },

  post: async (
    endpoint: string,
    data?: any,
    config?: { headers?: Record<string, string> }
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...config?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`POST request failed: ${response.statusText}`);
    }

    return response.json();
  },

  put: async (
    endpoint: string,
    data?: any,
    config?: { headers?: Record<string, string> }
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...config?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`PUT request failed: ${response.statusText}`);
    }

    return response.json();
  },

  delete: async (
    endpoint: string,
    config?: { headers?: Record<string, string> }
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...config?.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`DELETE request failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Auth
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>("/api/auth/login", "POST", credentials);
  },

  // Inventory
  getInventory: async (token: string): Promise<InventoryItem[]> => {
    return apiRequest<InventoryItem[]>(
      "/api/inventory",
      "GET",
      undefined,
      token
    );
  },

  updateInventory: async (
    id: string,
    update: InventoryUpdateRequest,
    token: string
  ): Promise<InventoryItem> => {
    return apiRequest<InventoryItem>(
      `/api/inventory/update/${id}`,
      "POST",
      update,
      token
    );
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    return apiRequest<{ status: string }>("/health");
  },

  // Get user - Fix the return type to match what the backend actually sends
  getUser: async (token: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>("/api/auth/me", "GET", undefined, token);
  },

  // Add a new user to the waiting list
  addUserToWaitingList: async (
    formData: WaitingListFormData
  ): Promise<void> => {
    return apiRequest<void>("/api/waiting-list", "POST", formData);
  },
};
