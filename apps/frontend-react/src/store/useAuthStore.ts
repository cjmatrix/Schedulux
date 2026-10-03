import { create } from 'zustand';

// Unified user interface combining both tenant and dashboard user fields
export interface UserData {
  tenant_id: string;
  business_name?: string;
  contact_email?: string;
  email?: string;
  name?: string;
  tier?: string;
  status?: string;
  user_id?: string;
  system_role?: 'owner' | 'root' | 'manager'; 
  [key: string]: any;
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
