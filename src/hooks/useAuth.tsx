import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isParent: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent repeated provisioning attempts if a user exists without a profile
  const provisioningAttemptedRef = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Reset provisioning attempt on sign-out
        if (!session?.user) {
          provisioningAttemptedRef.current = false;
        }
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const provisionMissingProfile = async (u: User) => {
    if (provisioningAttemptedRef.current) return;
    provisioningAttemptedRef.current = true;

    // Best-effort: use metadata name, otherwise derive from email
    const fallbackName = (u.email?.split('@')[0] || 'Parent').replace(/[._-]+/g, ' ').trim();
    const parentName = (typeof u.user_metadata?.name === 'string' && u.user_metadata.name.trim().length >= 2)
      ? u.user_metadata.name.trim()
      : (fallbackName.length >= 2 ? fallbackName : 'Parent');

    const { error: rpcError } = await supabase.rpc('create_household_with_parent_profile', {
      parent_name: parentName,
    });

    if (rpcError) {
      console.error('Auto-provision profile failed:', rpcError);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        return;
      }

      // If the user exists but has no profile row (common after a failed early signup),
      // attempt a one-time self-heal by creating household + parent profile.
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser?.id === userId) {
        await provisionMissingProfile(currentUser);

        const { data: repairedProfile, error: repairedError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!repairedError && repairedProfile) {
          setProfile(repairedProfile as Profile);
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          }
        }
      });

      if (authError) {
        return { error: authError };
      }

      // Wait for the session to be established
      if (authData.user && authData.session) {
        // Session is immediately available (auto-confirm enabled)
        // Create household and profile atomically via secure RPC
        const { error: rpcError } = await supabase
          .rpc('create_household_with_parent_profile', {
            parent_name: name,
          });

        if (rpcError) {
          console.error('Household/profile creation error:', rpcError);
          return { error: rpcError };
        }

        // Fetch the profile to update state
        await fetchProfile(authData.user.id);
      } else if (authData.user && !authData.session) {
        // Email confirmation required - inform user
        return { error: new Error('Please check your email to confirm your account before signing in.') };
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        setProfile(data as Profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isParent: profile?.type === 'parent',
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
