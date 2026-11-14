import { create } from 'zustand';
import type { DashboardUserInfo } from '../features/dashboard-user/api/authApi';

interface DashboardAuthState {
  user: DashboardUserInfo | null;
  isAuthenticated: boolean;
  setUser: (userData: DashboardUserInfo | null) => void;
  login: (userData: DashboardUserInfo) => void;
  setActiveAgentId: (agentId: string) => void;
  logout: () => void;
}

export const useDashboardAuthStore = create<DashboardAuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (userData: DashboardUserInfo | null) => {
    set({ user: userData, isAuthenticated: Boolean(userData) });
  },

  login: (userData: DashboardUserInfo) => {
    set({ user: userData, isAuthenticated: true });
  },

  setActiveAgentId: (agentId: string) => {
    set((state) => ({
      user: state.user ? { ...state.user, agent_id: agentId } : null,
    }));
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));

