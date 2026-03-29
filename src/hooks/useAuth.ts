import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import type { Profile } from '@/types/database';


export function useAuth() {
  const { 
    session, 
    user, 
    profile, 
    isLoading, 
    isInitialized,
    setSession, 
    setProfile, 
    setLoading, 
    finalizeInitialization,
    logout 
  } = useAuthStore();
  const { setMode, setAccentColor } = useThemeStore();

  useEffect(() => {
    if (isInitialized) return;

    let timeoutId: number | null = null;
    let isMounted = true;

    // Safety timeout: if Supabase doesn't respond in 8s
    timeoutId = window.setTimeout(() => {
      if (isMounted && !useAuthStore.getState().isInitialized) {
        console.warn('⚡ Auth initialization timed out (8s) — unlocking UI');
        finalizeInitialization();
      }
    }, 8000);



    const checkSession = async () => {
      console.log('🔍 Checking Supabase session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted) {
          console.log('✅ Session found:', session?.user?.email || 'none');
          setSession(session);
          if (session?.user) {
            console.log('👤 Fetching profile for:', session.user.id);
            await fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('❌ Auth check failed:', err);
      } finally {
        if (isMounted) {
          console.log('🏁 Initial auth check complete');
          if (timeoutId) clearTimeout(timeoutId);
          finalizeInitialization();
        }
      }
    };


    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
        
        // Ensure initialization completes on any auth change if not already done
        if (!useAuthStore.getState().isInitialized) {
          finalizeInitialization();
        }
      }
    );

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const prof = data as Profile;
      setProfile(prof);

      // Apply user's theme prefs
      if (prof.theme) setMode(prof.theme);
      if (prof.accent_color) setAccentColor(prof.accent_color);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUpWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return data;
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    logout();
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data as Profile);
    return data;
  }

  return {
    session,
    user,
    profile,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
    updateProfile,
    fetchProfile,
  };
}
