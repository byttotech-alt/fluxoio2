import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Segment } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  finalizeInitialization: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
      setSession: (session) => set({ session, user: session?.user ?? null }),
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      finalizeInitialization: () => set({ isInitialized: true, isLoading: false }),
      logout: () => set({ session: null, user: null, profile: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        profile: state.profile,
        // Don't persist isLoading or isInitialized to true
      }),
    }
  )
);
