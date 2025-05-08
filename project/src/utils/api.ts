import { API_URL } from '../config/api';
import { ApiResponse } from '../types';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { requiresAuth = false, ...fetchOptions } = options;
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  });

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to continue');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle network errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      if (response.status === 404) {
        throw new Error('The requested resource was not found.');
      }
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
    }

    const data = await response.json() as ApiResponse<T>;

    // Handle API-level errors
    if (!data.success) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
} 