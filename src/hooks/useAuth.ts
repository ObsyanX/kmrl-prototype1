import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  employee_id: string;
  full_name: string;
  department: string;
  roles: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile after successful authentication
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await (supabase
        .from('profiles' as any)
        .select('employee_id, full_name, department')
        .eq('user_id', userId)
        .single() as any);

      if (profileError) throw profileError;

      const { data: rolesData, error: rolesError } = await (supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', userId) as any);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map((r: any) => r.role) || [];
      setProfile({
        employee_id: profileData?.employee_id || '',
        full_name: profileData?.full_name || '',
        department: profileData?.department || '',
        roles
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please check your email and click the confirmation link. For development, email confirmation can be disabled in Supabase settings.";
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
        }
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata: {
    employee_id: string;
    full_name: string;
    department: string;
  }) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      if (error) {
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes('Unable to validate email address')) {
          errorMessage = "Please enter a valid email address.";
        }
        
        toast({
          title: "Registration Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Registration Successful", 
        description: "Please check your email to confirm your account. For development, email confirmation can be disabled in Supabase settings.",
      });

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.roles?.includes(role) || false;
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole
  };
};