import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import type { Profile } from '@/types/database';

let isInitializeStarted = false;

export function useAuth() {
  const { session, user, profile, isLoading, setSession, setProfile, setLoading, logout } = useAuthStore();
  const { setMode, setAccentColor } = useThemeStore();

  useEffect(() => {
    if (isInitializeStarted) return;
    isInitializeStarted = true;

    let didFinish = false;

    // Safety timeout: if Supabase doesn't respond in 5 seconds,
    // force loading to false so the user sees the login page
    const safetyTimer = setTimeout(() => {
      if (!didFinish) {
        console.warn('Auth initialization timed out after 5s — forcing load complete');
        didFinish = true;
        setLoading(false);
      }
    }, 5000);

    function markDone() {
      didFinish = true;
      clearTimeout(safetyTimer);
    }

    // Get initial session safely
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (didFinish) return; // timeout already fired
        if (error) throw error;
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id).then(markDone);
        } else {
          markDone();
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Auth initialization error:', err);
        markDone();
        setLoading(false);
      });

    // Listen for auth changes globally
    supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );
  }, []);

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
