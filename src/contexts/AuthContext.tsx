import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: Record<string, { password: string; user: User }> = {
  'info@wazireducationsociety.com': {
    password: 'WES@OneDesk786',
    user: {
      id: '1',
      name: 'Admin User',
      email: 'info@wazireducationsociety.com',
      role: 'admin',
    },
  },
  'manager@wes.com': {
    password: 'manager123',
    user: {
      id: '2',
      name: 'John Manager',
      email: 'manager@wes.com',
      role: 'manager',
    },
  },
  'employee@wes.com': {
    password: 'employee123',
    user: {
      id: '3',
      name: 'Sarah Employee',
      email: 'employee@wes.com',
      role: 'employee',
    },
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('wes_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const demoUser = demoUsers[email.toLowerCase()];
    if (demoUser && demoUser.password === password) {
      setUser(demoUser.user);
      localStorage.setItem('wes_user', JSON.stringify(demoUser.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('wes_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
