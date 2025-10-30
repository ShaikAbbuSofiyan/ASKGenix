import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setUser(data);
      } else {
        localStorage.removeItem('userId');
      }
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, password_hash')
        .eq('email', email)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (data.password_hash !== password) {
        return { success: false, error: 'Invalid email or password' };
      }

      const userData = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      };

      setUser(userData);
      localStorage.setItem('userId', data.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: password,
            full_name: fullName,
            role: 'student',
          },
        ])
        .select('id, email, full_name, role')
        .single();

      if (error || !data) {
        return { success: false, error: 'Failed to create account' };
      }

      const userData = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      };

      setUser(userData);
      localStorage.setItem('userId', data.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
