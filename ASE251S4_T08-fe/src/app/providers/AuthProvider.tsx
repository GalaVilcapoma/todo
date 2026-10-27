import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  name: string;
  role: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (userData: AuthUser, token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEFAULT_USER: AuthUser = {
  name: 'Operador Avsa',
  role: 'ADMIN',
  email: 'admin@avsa.pe',
};

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredUser = (): AuthUser | null => {
  const savedUser = localStorage.getItem('avsa_user');
  if (!savedUser) return DEFAULT_USER;

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    localStorage.removeItem('avsa_user');
    return DEFAULT_USER;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = (userData: AuthUser, token?: string) => {
    setUser(userData);
    localStorage.setItem('avsa_user', JSON.stringify(userData));
    if (token) localStorage.setItem('avsa_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('avsa_user');
    localStorage.removeItem('avsa_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
