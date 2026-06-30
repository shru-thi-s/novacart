import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          // You could hit /api/auth/me here to validate token
          // Since it's not implemented yet in this version, we assume it's valid
          // If you have a real /me endpoint, do: const { data } = await api.get('/auth/me');
          // set({ user: data, isAuthenticated: true });
          
          set({ isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          console.log('FULL LOGIN RESPONSE:', { status: response.status, data: response.data });
          const { data } = response;
          
          set({
            user: {
              id: data.id || data._id,
              name: data.name,
              email: data.email,
              role: data.role,
              avatar: data.avatar,
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          return true;
        } catch (error) {
          console.error('LOGIN ERROR:', error);
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false
          });
          return false;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { name, email, password });
          console.log('FULL REGISTER RESPONSE:', { status: response.status, data: response.data });
          const { data } = response;

          set({
            user: {
              id: data.id || data._id,
              name: data.name,
              email: data.email,
              role: data.role,
              avatar: data.avatar,
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          return true;
        } catch (error) {
          console.error('REGISTER ERROR:', error);
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false
          });
          return false;
        }
      },

      googleLogin: async (credential) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/google', { googleToken: credential });
          set({
            user: {
              id: data.user.id || data.user._id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              avatar: data.user.avatar
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Google login failed',
            isLoading: false
          });
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      }
    }),
    {
      name: 'novacart-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
