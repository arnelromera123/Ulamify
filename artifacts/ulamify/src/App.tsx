import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/app-shell';
import { PinLoginModal } from '@/components/pin-login-modal';
import { AuthProvider } from '@/context/auth-context';
import { DashboardPage, KitchenPage, MenuManagementPage, OrdersPage, PosPage, PurchasingPage, RolesPage, SettingsPage, UsersPage } from '@/pages/app-pages';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <AppShell>
        <Switch>
          <Route path="/" component={PosPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/orders" component={OrdersPage} />
          <Route path="/kitchen" component={KitchenPage} />
          <Route path="/menu" component={MenuManagementPage} />
          <Route path="/purchasing" component={PurchasingPage} />
          <Route path="/roles" component={RolesPage} />
          <Route path="/users" component={UsersPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <PinLoginModal />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
