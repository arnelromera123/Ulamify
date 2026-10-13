import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RolePermission, User, UserRole } from '@workspace/api-client-react';
import {
  getGetAuthSessionQueryKey,
  useGetAuthSession,
  useLogin,
  useLogout,
} from '@workspace/api-client-react';

const legacyRolePermissions: Record<string, RolePermission[]> = {
  owner: ['counter', 'dashboard', 'orders', 'kitchen', 'purchasing', 'settings', 'manage-staff', 'configure-prices', 'costing'],
  manager: ['dashboard', 'purchasing', 'costing'],
  cashier: ['counter', 'orders'],
  kitchen: ['kitchen'],
  purchaser: ['purchasing'],
};

const SIGNED_OUT_USER: User = {
  id: 0,
  name: 'Signed out',
  role: 'guest' as UserRole,
  roleName: 'Sign in required',
  permissions: [],
  isActive: true,
  createdAt: '',
};

interface AuthContextType {
  currentUser: User;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  loginWithPin: (pin: string) => Promise<string | null>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  hasPermission: (permission: RolePermission) => boolean;
  canAccessPath: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User>(SIGNED_OUT_USER);
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const sessionQuery = useGetAuthSession({
    query: {
      queryKey: getGetAuthSessionQueryKey(),
      retry: false,
      staleTime: 0,
    },
  });
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (sessionQuery.data?.user) {
      setCurrentUser(sessionQuery.data.user);
      setIsLoginOpen(false);
    } else if (sessionQuery.isError) {
      setCurrentUser(SIGNED_OUT_USER);
      setIsLoginOpen(true);
    }
  }, [sessionQuery.data, sessionQuery.isError]);

  useEffect(() => {
    const requireSignIn = () => {
      queryClient.clear();
      setCurrentUser(SIGNED_OUT_USER);
      setIsLoginOpen(true);
    };
    window.addEventListener('ulamify:auth-required', requireSignIn);
    return () => window.removeEventListener('ulamify:auth-required', requireSignIn);
  }, [queryClient]);

  useEffect(() => {
    try {
      localStorage.removeItem('ulamify_active_user');
    } catch {
      // Storage may be unavailable.
    }
  }, []);

  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => {
    if (currentUser.role !== 'guest') setIsLoginOpen(false);
  };

  const loginWithPin = async (pin: string): Promise<string | null> => {
    try {
      const res = await loginMutation.mutateAsync({ data: { pin } });
      if (res?.user) {
        queryClient.setQueryData(getGetAuthSessionQueryKey(), res);
        void queryClient.invalidateQueries();
        setCurrentUser(res.user);
        setIsLoginOpen(false);
        return null;
      }
      return 'Sign-in did not return a staff account. Try again.';
    } catch (error) {
      if (typeof error === 'object' && error !== null) {
        if ('status' in error && error.status === 429) {
          return 'Too many failed PIN attempts. Wait 15 minutes before trying again.';
        }
        if ('data' in error && typeof error.data === 'object' && error.data !== null &&
          'error' in error.data && typeof error.data.error === 'string') {
          return error.data.error;
        }
        if ('status' in error && error.status === 401) return 'Invalid staff PIN. Try again.';
      }
      return 'Could not reach the sign-in service. Check the connection and try again.';
    }
  };

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setCurrentUser(SIGNED_OUT_USER);
        setIsLoginOpen(true);
      },
    });
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
    if (path === '/costing') return currentUser.role === 'owner' || currentUser.role === 'manager';
    if (path === '/settings') {
      return (['settings', 'manage-staff', 'configure-prices'] as RolePermission[]).some(hasPermission);
    }
    const pathPermissions: Record<string, RolePermission> = {
      '/': 'counter',
      '/dashboard': 'dashboard',
      '/orders': 'orders',
      '/kitchen': 'kitchen',
      '/purchasing': 'purchasing',
      '/inventory': 'purchasing',
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
