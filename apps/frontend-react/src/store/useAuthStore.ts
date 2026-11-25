import { create } from 'zustand';

export interface UserData {
  tenant_id: string;
  agent_id?: string;
  agent_ids?: string[];
  business_name?: string;
  contact_email?: string;
  email?: string;
  name?: string;
  tier?: string;
  status?: string;
  user_id?: string;
  system_role?: 'owner' | 'manager';
  created_at?: string;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  setUser: (userData: UserData | null) => void;
  login: (userData: UserData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (userData: UserData | null) => {
    set({ user: userData, isAuthenticated: Boolean(userData) });
  },

  login: (userData: UserData) => {
    const processedUser = {
      ...userData,
      system_role: userData.system_role || 'owner',
    };
    set({ user: processedUser, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
