'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UserRole = 'TALENT' | 'COMPANY' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
  companyName?: string;
  aadhaarVerified?: boolean;
  gstVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch current user on initial load and when pathname changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include', // Important for cookies
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to prevent flash of loading state
    const timer = setTimeout(() => {
      fetchUser();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pathname]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const { user } = await res.json();
    setUser(user);
    
    // Redirect based on role
    if (user.role === 'ADMIN') {
      router.push('/admin');
    } else if (user.role === 'COMPANY') {
      router.push('/company');
    } else {
      router.push('/talent');
    }
  };

  const register = async (data: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }

    const { user } = await res.json();
    setUser(user);
    
    // Redirect based on role
    if (user.role === 'COMPANY') {
      router.push('/company/onboarding');
    } else {
      router.push('/talent/onboarding');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const { user } = await res.json();
      setUser(user);
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
