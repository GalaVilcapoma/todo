import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services';
import type { LoginPayload, SessionUser } from '../types';

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  /** True mientras se restaura la sesión guardada; el splash espera a esto. */
  isRestoring: boolean;
  signIn: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await authService.loadSession();
      if (!cancelled) {
        setUser(restored);
        setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const result = await authService.signIn(payload.username, payload.password);
    if (result.success) {
      const session = await authService.loadSession();
      setUser(session);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isRestoring,
      signIn,
      signOut,
    }),
    [user, isRestoring, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Igual que `useAuth`, pero usable dentro de `_layout.tsx` (no es una pantalla). */
export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession debe usarse dentro de <AuthProvider>.');
  }
  return context;
}

export default AuthProvider;