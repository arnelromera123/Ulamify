import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { RolePermission, User, UserRole } from '@workspace/api-client-react';
import { useLogin } from '@workspace/api-client-react';

const STORAGE_KEY = 'ulamify_active_user';

const legacyRolePermissions: Record<string, RolePermission[]> = {
  owner: ['counter', 'dashboard', 'orders', 'kitchen', 'purchasing', 'settings', 'manage-staff', 'configure-prices'],
  cashier: ['counter', 'orders'],
  kitchen: ['kitchen'],
  purchaser: ['purchasing'],
};

const DEFAULT_OWNER_USER: User = {
  id: 1,
  name: 'Owner Admin',
  role: 'owner' as UserRole,
  roleName: 'Owner / Admin',
  permissions: [
    'counter',
    'dashboard',
    'orders',
    'kitchen',
    'purchasing',
    'settings',
    'manage-staff',
    'configure-prices',
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
};

interface AuthContextType {
  currentUser: User;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  loginWithPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  hasPermission: (permission: RolePermission) => boolean;
  canAccessPath: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_OWNER_USER;
    } catch {
      return DEFAULT_OWNER_USER;
    }
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginMutation = useLogin();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } catch {
      // Storage unavailable
    }
  }, [currentUser]);

  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  const loginWithPin = async (pin: string): Promise<boolean> => {
    try {
      const res = await loginMutation.mutateAsync({ data: { pin } });
      if (res?.user) {
        setCurrentUser(res.user);
        setIsLoginOpen(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsLoginOpen(true);
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    return allowedRoles.includes(currentUser.role);
  };

  const hasPermission = (permission: RolePermission) => {
    const permissions = currentUser.permissions ?? legacyRolePermissions[currentUser.role] ?? [];
    return currentUser.role === 'owner' || permissions.includes(permission);
  };

  const canAccessPath = (path: string) => {
    if (path === '/roles') return currentUser.role === 'owner';
    if (path === '/users') return currentUser.role === 'owner' || hasPermission('manage-staff');
    if (path === '/menu') return hasPermission('configure-prices');
    if (path === '/settings') {
      return (['settings', 'manage-staff', 'configure-prices'] as RolePermission[]).some(hasPermission);
    }
    const pathPermissions: Record<string, RolePermission> = {
      '/': 'counter',
      '/dashboard': 'dashboard',
      '/orders': 'orders',
      '/kitchen': 'kitchen',
      '/purchasing': 'purchasing',
    };
    const permission = pathPermissions[path];
    return currentUser.role === 'owner' || (permission !== undefined && hasPermission(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoginOpen,
        openLogin,
        closeLogin,
        loginWithPin,
        logout,
        hasRole,
        hasPermission,
        canAccessPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
