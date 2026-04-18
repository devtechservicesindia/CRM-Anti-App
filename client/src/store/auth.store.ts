import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: User) => void;
  setInitializing: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: true,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isInitializing: false }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      updateUser: (user) =>
        set({ user }),

      setInitializing: (isInitializing) =>
        set({ isInitializing }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false }),
    }),
    {
      name: 'gaming-crm-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // After rehydration, isInitializing stays true until auto-refresh completes
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitializing = false;
        }
      },
    }
  )
);
