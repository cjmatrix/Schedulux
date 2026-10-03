import { create } from 'zustand';
import type { SuperAdminInfo } from '../api/superAdminAuthApi';

interface SuperAdminState {
  superAdmin: SuperAdminInfo | null;
  isAuthenticated: boolean;
  setSuperAdmin: (admin: SuperAdminInfo | null) => void;
  logout: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  superAdmin: null,
  isAuthenticated: false,

  setSuperAdmin: (admin: SuperAdminInfo | null) => {
    set({
      superAdmin: admin,
      isAuthenticated: Boolean(admin),
    });
  },

  logout: () => {
    set({ superAdmin: null, isAuthenticated: false });
  },
}));
