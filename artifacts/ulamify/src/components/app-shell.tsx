import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { BarChart3, ChefHat, CircleDollarSign, ClipboardList, LayoutGrid, Menu, Settings2, Wifi, WifiOff, X } from 'lucide-react';

const navigation = [
  { href: '/', label: 'Counter', icon: LayoutGrid },
  { href: '/dashboard', label: 'Today', icon: BarChart3 },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/purchasing', label: 'Palengke', icon: CircleDollarSign },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navigation.find((item) => item.href === location)?.label ?? 'Ulamify';

  return (
    <div className="app-noise min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary font-display text-xl font-extrabold text-sidebar-primary-foreground">U</span>
            <span><span className="block font-display text-xl font-extrabold tracking-tight">ulamify</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-sidebar-foreground/55">counter + ops</span></span>
          </Link>
          <button data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-sidebar-foreground/65 hover:bg-sidebar-accent md:hidden"><X size={18} /></button>
        </div>
        <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === location;
            return <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span>{href === '/' && <span className="ml-auto rounded bg-sidebar-foreground/10 px-1.5 py-0.5 font-mono text-[10px]">F1</span>}
            </Link>;
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <Link href="/settings" data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}><Settings2 size={18} /><span>Settings</span></Link>
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-sidebar-primary" />Bayanihan Kitchen</div>
            <div className="mt-1 pl-4 text-[11px] text-sidebar-foreground/55">Makati · Counter 01</div>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" data-testid="button-dismiss-menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-[#172039]/40 md:hidden" />}
      <main className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-[74px] items-center justify-between border-b border-border/70 bg-background/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3"><button data-testid="button-open-menu" onClick={() => setMobileOpen(true)} className="rounded-lg border border-border bg-card p-2 md:hidden"><Menu size={18} /></button><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Bayanihan Kitchen</p><h1 className="font-display text-xl font-bold tracking-tight">{current}</h1></div></div>
          <div className="flex items-center gap-3"><ConnectionStatus /><div className="hidden h-9 w-9 place-items-center rounded-full bg-secondary font-display font-bold text-secondary-foreground sm:grid">MR</div></div>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 md:p-9">{children}</div>
      </main>
    </div>
  );
}