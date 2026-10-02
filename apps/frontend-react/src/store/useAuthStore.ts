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
  login: (userData: UserData) => void;
  logout: () => void;
}

const getInitialUser = (): UserData | null => {
  try {
    const item = localStorage.getItem('auth_user');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialUser() !== null,

  login: (userData: UserData) => {
    
    const processedUser = {
      ...userData,
      system_role: userData.system_role || 'owner',
    };
    localStorage.setItem('auth_user', JSON.stringify(processedUser));
    set({ user: processedUser, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_user');
    set({ user: null, isAuthenticated: false });
  },
}));
