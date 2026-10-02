import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BarChart3,
  BookOpen,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  LayoutGrid,
  Lock,
  MoreHorizontal,
  Settings2,
  ShieldCheck,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { UlamifyLogo } from '@/components/ulamify-logo';
import { getGetStoreProfileQueryKey, useGetStoreProfile } from '@workspace/api-client-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const navigation = [
  { href: '/', label: 'Counter', icon: LayoutGrid },
  { href: '/dashboard', label: 'Today', icon: BarChart3 },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/menu', label: 'Menu Management', icon: BookOpen },
  { href: '/purchasing', label: 'Palengke', icon: CircleDollarSign },
  { href: '/users', label: 'Team Accounts', icon: Users },
  { href: '/roles', label: 'Roles', icon: ShieldCheck },
];

export function ConnectionStatus() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return (
    <div data-testid="status-connection" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${online ? 'bg-[#dcefe9] text-[#176557]' : 'bg-[#fff0dc] text-[#9b5414]'}`}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      {online ? 'Online' : 'Offline mode'}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const { currentUser, openLogin, canAccessPath } = useAuth();
  const storeProfileQuery = useGetStoreProfile({
    query: { queryKey: getGetStoreProfileQueryKey(), staleTime: 60_000 },
  });
  const storeName = storeProfileQuery.data?.name ?? 'Bayanihan Kitchen';
  const storeLocation = storeProfileQuery.data?.location ?? 'Makati';
  const current = navigation.find((item) => item.href === location)?.label ?? 'Ulamify';

  const filteredNav = navigation.filter((item) => canAccessPath(item.href));
  const mobileNav = filteredNav.slice(0, 4);
  const mobileMoreItems = [
    ...filteredNav.slice(4),
    ...(canAccessPath('/settings') ? [{ href: '/settings', label: 'Settings', icon: Settings2 }] : []),
  ];
  const isMobileMoreActive = mobileMoreItems.some((item) => item.href === location);
  const isAllowed = canAccessPath(location);

  const roleLabels: Record<string, { label: string; badgeClass: string }> = {
    owner: { label: '👑 Owner / Admin', badgeClass: 'bg-primary text-primary-foreground' },
    cashier: { label: '💻 Cashier', badgeClass: 'bg-[#dcefe9] text-[#176557]' },
    kitchen: { label: '🍳 Kitchen Staff', badgeClass: 'bg-[#fff0dc] text-[#9b5414]' },
    purchaser: { label: '🛒 Purchaser', badgeClass: 'bg-[#ffebe7] text-[#a84335]' },
  };

  const currentRoleInfo = roleLabels[currentUser.role] ?? { label: currentUser.roleName || currentUser.role, badgeClass: 'bg-muted text-foreground' };

  return (
    <div className="app-noise min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between px-3">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
            <UlamifyLogo
              textClassName="text-sidebar-foreground"
              subtitleClassName="text-sidebar-foreground/60"
            />
          </Link>
        </div>

        <div className="meta-label mt-6 px-3 text-[10px] font-bold uppercase text-sidebar-foreground/45">Navigation</div>
        <nav className="mt-2 space-y-1">
          {filteredNav.map(({ href, label, icon: Icon }) => {
            const active = href === location;
            return <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span>{href === '/' && <span className="ml-auto rounded bg-sidebar-foreground/10 px-1.5 py-0.5 font-mono text-[10px]">F1</span>}
            </Link>;
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {canAccessPath('/settings') && (
            <Link href="/settings" data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
              <Settings2 size={18} /><span>Settings</span>
            </Link>
          )}
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-sidebar-primary" />{storeName}</div>
            <div className="mt-1 pl-4 text-[11px] text-sidebar-foreground/55">{storeLocation} · Counter 01</div>
          </div>
        </div>
      </aside>

      <main className={`min-h-[100dvh] ${location === '/' ? 'pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-24 xl:pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0'} md:pl-[248px]`}>
        <header className="sticky top-0 z-10 hidden h-[74px] items-center justify-between border-b border-border/70 bg-background/95 px-5 backdrop-blur md:flex md:px-9">
          <div className="flex items-center gap-3">
            <div>
              <p className="meta-label text-xs font-semibold uppercase text-muted-foreground">{storeName}</p>
              <h1 className="font-display text-xl font-bold tracking-tight">{current}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <button
              onClick={openLogin}
              data-testid="button-active-session"
              title="Switch staff account"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-left transition hover:border-primary sm:gap-3 sm:px-3"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block max-w-36 truncate text-xs font-bold text-foreground sm:max-w-48">
                  {currentUser.name}
                </span>
                <span className="mt-0.5 block max-w-36 truncate text-[10px] font-semibold text-muted-foreground sm:max-w-48">
                  {currentUser.roleName || currentRoleInfo.label}
                </span>
              </span>
              <UserCheck size={14} className="shrink-0 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className={`mx-auto max-w-[1500px] ${location === '/' || location === '/dashboard' || location === '/orders' || location === '/kitchen' || location === '/menu' || location === '/users' || location === '/roles' || location === '/settings' ? 'p-3 md:p-9' : 'p-5 md:p-9'}`}>
          {isAllowed ? (
            children
          ) : (
            <div data-testid="access-restricted-card" className="mx-auto my-12 max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-md animate-rise">
              <span className="mx-auto mb-4 grid h-14 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                <Lock size={28} />
              </span>
              <h2 className="font-display text-2xl font-extrabold">Access Restricted</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your active role (<strong>{currentRoleInfo.label}</strong>) does not have permission to view or manage this section.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={openLogin}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground shadow transition hover:brightness-95"
                >
                  <UserCheck size={16} />
                  Switch Staff PIN
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <nav
        aria-label="Primary navigation"
        data-testid="mobile-bottom-navigation"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-1 pt-2 shadow-[0_-6px_20px_-16px_hsl(224_32%_17%/.35)] backdrop-blur-[12px] pb-[max(.5rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="relative z-20 mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNav.map(({ href, label, icon: Icon }) => {
            const active = href === location;
            return (
              <Link
                key={href}
                href={href}
                data-testid={`mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition-colors ${active && !isMobileMoreActive && !mobileMoreOpen ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            data-testid="mobile-nav-more"
            aria-expanded={mobileMoreOpen}
            onClick={() => setMobileMoreOpen((open) => !open)}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition-colors ${isMobileMoreActive || mobileMoreOpen ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <MoreHorizontal size={19} />
            <span>More</span>
          </button>
        </div>
      </nav>
      <Sheet open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[75dvh] overflow-y-auto rounded-t-3xl border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
          data-testid="mobile-more-sheet"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>More navigation</SheetTitle>
            <SheetDescription>Additional pages and account actions.</SheetDescription>
          </SheetHeader>
          <div className="mb-3 rounded-xl bg-muted/60 p-2">
            <div className="flex items-center justify-between px-1 py-1">
              <span className="truncate text-xs font-semibold text-foreground">{currentUser.name}</span>
              <ConnectionStatus />
            </div>
            <button
              type="button"
              data-testid="mobile-switch-staff"
              onClick={() => {
                setMobileMoreOpen(false);
                openLogin();
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted"
            >
              <UserCheck size={18} />
              Switch staff PIN
            </button>
          </div>
          <div className="grid gap-1">
            {mobileMoreItems.map(({ href, label, icon: Icon }) => {
              const active = href === location;
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid={`mobile-more-${label.toLowerCase().replaceAll(' ', '-')}`}
                  onClick={() => setMobileMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
