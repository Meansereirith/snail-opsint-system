import { create } from 'zustand';
import { supabase, User, Role, Permission } from './supabase';
import { getUserPermissions, isAdmin, getRole } from './permissions';

interface AuthState {
  user: User | null;
  role: Role | null;
  permissions: Permission[];
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  permissions: [],
  isAdmin: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await get().fetchUser();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, role: null, permissions: [], isAdmin: false, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      set({ error: message, isLoading: false });
    }
  },

  fetchUser: async () => {
    try {
      // Get current auth session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        set({ user: null, role: null, permissions: [], isAdmin: false, isLoading: false });
        return;
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      if (userData) {
        // Fetch user permissions
        const permissions = await getUserPermissions(userData.id);
        const isAdminUser = await isAdmin(userData.id);
        const role = await getRole(userData.role_id);

        set({
          user: userData,
          role: role,
          permissions: permissions,
          isAdmin: isAdminUser,
          isLoading: false,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user';
      set({ error: message, isLoading: false });
    }
  },

  hasPermission: (resource: string, action: string) => {
    const { permissions, isAdmin: isAdminUser } = get();
    if (isAdminUser) return true;
    return permissions.some(p => p.resource === resource && p.action === action);
  },

  clearError: () => set({ error: null }),
}));

// Initialize auth on load
if (typeof window !== 'undefined') {
  const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      await useAuthStore.getState().fetchUser();
    } else {
      useAuthStore.setState({ user: null, role: null, permissions: [], isAdmin: false });
    }
  });
}
