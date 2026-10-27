import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import type { SessionUser, UserRole } from '../types';

/**
 * Autenticación LOCAL.
 *
 * El backend ASE251S4_T08-be no implementa autenticación: no incluye
 * spring-security, no hay SecurityConfig ni WebFilter, no existe
 * POST /api/auth/login y ningún endpoint lee la cabecera Authorization. Todos
 * los controladores están abiertos con @CrossOrigin("*").
 *
 * Por eso esta pantalla NO es un login real contra la API: valida el usuario
 * contra los perfiles de demostración definidos abajo y guarda la sesión en el
 * dispositivo. Su función es únicamente ordenar el flujo de la app, no
 * proteger datos. Cuando el backend incorpore autenticación real, este archivo
 * es el único punto que hay que reemplazar.
 */

interface DemoProfile {
  username: string;
  password: string;
  user: SessionUser;
}

/**
 * Credenciales de la demo. Se muestran en la propia pantalla de login.
 *
 * Los usuarios y contraseñas corresponden exactamente a los registros de la
 * tabla `users` del backend (password_hash almacenado en texto plano en la
 * demo — ver seed SQL). Los roles se mapean desde ROLE_* del backend al
 * UserRole local de la app.
 */
export const DEMO_PROFILES: readonly DemoProfile[] = [
  // — Administradores —
  {
    username: 'admin',
    password: 'admin123',
    user: { id: 'u-1', name: 'Carlos Mendoza Ríos', email: 'admin@avsa.pe', role: 'ADMIN' },
  },
  {
    username: 'admin2',
    password: 'admin2123',
    user: { id: 'u-10', name: 'Jorge Vargas Medina', email: 'jvargas@avsa.pe', role: 'ADMIN' },
  },
  // — Supervisores —
  {
    username: 'supervisor1',
    password: 'supervisor1123',
    user: { id: 'u-2', name: 'María Elena Torres', email: 'mtorres@avsa.pe', role: 'SUPERVISOR' },
  },
  {
    username: 'supervisor2',
    password: 'supervisor2123',
    user: { id: 'u-7', name: 'Luis Fernández Prado', email: 'lfernandez@avsa.pe', role: 'SUPERVISOR' },
  },
  {
    username: 'supervisor3',
    password: 'supervisor3123',
    user: { id: 'u-13', name: 'Patricia Salazar Rojas', email: 'psalazar@avsa.pe', role: 'SUPERVISOR' },
  },
  // — Técnicos —
  {
    username: 'tech_juan',
    password: 'tech_juan123',
    user: { id: 'u-3', name: 'Juan Pérez Castro', email: 'jperez@avsa.pe', role: 'TECHNICIAN' },
  },
  {
    username: 'tech_rosa',
    password: 'tech_rosa123',
    user: { id: 'u-4', name: 'Rosa Huamán Valdez', email: 'rhuaman@avsa.pe', role: 'TECHNICIAN' },
  },
  {
    username: 'tech_sofia',
    password: 'tech_sofia123',
    user: { id: 'u-11', name: 'Sofía Castillo Vera', email: 'scastillo@avsa.pe', role: 'TECHNICIAN' },
  },
  {
    username: 'tech_miguel',
    password: 'tech_miguel123',
    user: { id: 'u-8', name: 'Miguel Ángel Ramos', email: 'mramos@avsa.pe', role: 'TECHNICIAN' },
  },
  // — Logística —
  {
    username: 'logistica1',
    password: 'logistica1123',
    user: { id: 'u-5', name: 'Pedro García Torres', email: 'pgarcia@avsa.pe', role: 'LOGISTICS' },
  },
  {
    username: 'logistica2',
    password: 'logistica2123',
    user: { id: 'u-9', name: 'Carmen Díaz Luna', email: 'cdiaz@avsa.pe', role: 'LOGISTICS' },
  },
  // — Certificaciones —
  {
    username: 'cert_ana',
    password: 'cert_ana123',
    user: { id: 'u-6', name: 'Ana Quispe Rojas', email: 'aquispe@avsa.pe', role: 'CERTIFICACIONES' },
  },
  {
    username: 'cert_diego',
    password: 'cert_diego123',
    user: { id: 'u-12', name: 'Diego Morales Soto', email: 'dmorales@avsa.pe', role: 'CERTIFICACIONES' },
  },
  // — Perfiles genéricos de demo —
  {
    username: 'gerente',
    password: 'gerente123',
    user: { id: 'u-gerente', name: 'Gerente de Campo', email: 'gerente@avsa.pe', role: 'GERENTE' },
  },
  {
    username: 'operador',
    password: 'operador123',
    user: { id: 'u-operador', name: 'Operador de Campo', email: 'operador@avsa.pe', role: 'OPERADOR' },
  },
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  OPERADOR: 'Operador',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Técnico',
  LOGISTICS: 'Logística',
  CERTIFICACIONES: 'Certificaciones',
};

interface StoredSession {
  user: SessionUser;
  savedAt: string;
}

export interface SignInResult {
  success: boolean;
  error?: string;
}

export const authService = {
  /** Valida las credenciales contra los perfiles locales. */
  async signIn(username: string, password: string): Promise<SignInResult> {
    const user = username.trim().toLowerCase();
    if (!user) return { success: false, error: 'Ingresa tu usuario.' };
    if (!password) return { success: false, error: 'Ingresa tu contraseña.' };

    const profile = DEMO_PROFILES.find(
      (p) => p.username === user && p.password === password,
    );
    if (!profile) {
      return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const session: StoredSession = {
      user: profile.user,
      savedAt: new Date().toISOString(),
    };
    await storage.setObject<StoredSession>(STORAGE_KEYS.SESSION, session);
    return { success: true };
  },

  /**
   * Restaura la sesión guardada, si sigue siendo válida.
   */
  async loadSession(): Promise<SessionUser | null> {
    const session = await storage.getObject<StoredSession>(STORAGE_KEYS.SESSION);
    const user = session?.user;
    if (!user?.id) return null;
    // Descarta sesiones cuyo usuario ya no exista en los perfiles locales,
    // por ejemplo tras cambiar la lista de la demo.
    const known = DEMO_PROFILES.some((p) => p.user.id === user.id);
    return known ? user : null;
  },

  async signOut(): Promise<void> {
    await storage.remove(STORAGE_KEYS.SESSION);
  },
};

export default authService;