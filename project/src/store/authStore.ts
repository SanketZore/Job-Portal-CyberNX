import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, ApiResponse } from '../types';
import { API_URL, API_ENDPOINTS } from '../config/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; role: 'employer' | 'jobseeker' }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  initialize: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      initialize: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`${API_URL}${API_ENDPOINTS.auth.me}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data: ApiResponse<User> = await response.json();
            
            if (data.success && data.data) {
              set({
                user: data.data,
                isAuthenticated: true,
                token
              });
            } else {
              // If token is invalid, clear it
              localStorage.removeItem('token');
              set({ user: null, isAuthenticated: false, token: null });
            }
          } catch (error) {
            console.error('Auth initialization error:', error);
            localStorage.removeItem('token');
            set({ user: null, isAuthenticated: false, token: null });
          }
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_URL}${API_ENDPOINTS.auth.login}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data: ApiResponse<{ user: User; token: string }> = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          if (data.success && data.data) {
            const { user, token } = data.data;
            set({
              user,
              isAuthenticated: true,
              token,
            });
            localStorage.setItem('token', token);
            console.log('Token stored:', token); // Debug log
          } else {
            throw new Error(data.message || 'Login failed');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      register: async (userData) => {
        try {
          const response = await fetch(`${API_URL}${API_ENDPOINTS.auth.register}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          const data: ApiResponse<{ user: User; token: string }> = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isAuthenticated: true,
              token: data.data.token,
            });
            // Store token in localStorage for persistence
            localStorage.setItem('token', data.data.token);
          } else {
            throw new Error(data.message || 'Registration failed');
          }
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, token: null });
        localStorage.removeItem('token');
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);

export default useAuthStore; 