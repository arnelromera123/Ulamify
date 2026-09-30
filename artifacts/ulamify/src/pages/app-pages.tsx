import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, Check, ChevronRight, CircleAlert, Clock3, CreditCard, Minus, Plus, Printer, Receipt, RefreshCw, Search, ShoppingBasket, Store, Trash2, TrendingUp, Utensils, WalletCards, X } from 'lucide-react';
import {
  ExpenseLogInputCategory,
  OrderInputPaymentMethod,
  type DashboardSummary,
  type Product,
  type Order,
  useCreateExpenseLog,
  useCreateOrder,
  useCreateProductionLog,
  useGetDashboardSummary,
  useListOrders,
  useListProducts,
  useUpdateProduct,
  getGetDashboardSummaryQueryKey,
  getListOrdersQueryKey,
  getListProductsQueryKey,
} from '@workspace/api-client-react';
import { useOfflineQueue } from '@/hooks/use-offline-queue';

const fallbackProducts: Product[] = [
  { id: 1, name: 'Adobo flakes', category: 'Ulam', price: 78, isAvailable: true, accent: '#e97b45' },
  { id: 2, name: 'Sinigang na baboy', category: 'Ulam', price: 92, isAvailable: true, accent: '#198274' },
  { id: 3, name: 'Chicken inasal', category: 'Ulam', price: 105, isAvailable: true, accent: '#d9922e' },
  { id: 4, name: 'Ginisang monggo', category: 'Ulam', price: 65, isAvailable: true, accent: '#667b54' },
  { id: 5, name: 'Extra rice', category: 'Rice', price: 25, isAvailable: true, accent: '#c5a36a' },
  { id: 6, name: 'Iced calamansi', category: 'Beverage', price: 38, isAvailable: true, accent: '#dfbd3f' },
  { id: 7, name: 'Bottled water', category: 'Beverage', price: 22, isAvailable: true, accent: '#6a93b4' },
  { id: 8, name: 'Fried egg', category: 'Add-on', price: 20, isAvailable: true, accent: '#e7ae3b' },
];

const money = (value = 0) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compactMoney = (value = 0) => `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
const time = (value: string) => new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.19em] text-secondary">{eyebrow}</p><h2 className="font-display text-3xl font-extrabold tracking-[-.04em] md:text-4xl">{title}</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{detail}</p></div>
    {action}
  </div>;
}

function Notice({ message, tone = 'success', onClose }: { message: string; tone?: 'success' | 'error'; onClose: () => void }) {
  return <div role="status" data-testid="status-notice" className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-md animate-rise ${tone === 'success' ? 'border-[#9ad2c3] bg-[#e9f7f1] text-[#176557]' : 'border-[#e6b2a9] bg-[#fff0ed] text-[#9e382c]'}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-current/10">{tone === 'success' ? <Check size={16} /> : <CircleAlert size={16} />}</span><span>{message}</span><button data-testid="button-close-notice" onClick={onClose} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button></div>;
}

function LoadingBlocks() {
  return <div data-testid="state-loading" className="grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /></div>;
}

function EmptyState({ title, detail, icon: Icon = Receipt }: { title: string; detail: string; icon?: typeof Receipt }) {
  return <div data-testid="state-empty" className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 text-center"><span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon size={19} /></span><p className="font-display text-lg font-bold">{title}</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">{detail}</p></div>;
}

function StatCard({ label, value, detail, icon: Icon, accent = 'orange', trend }: { label: string; value: string; detail: string; icon: typeof TrendingUp; accent?: string; trend?: 'up' | 'down' }) {
  const colors: Record<string, string> = { orange: 'bg-[#fff0dc] text-[#9b5414]', teal: 'bg-[#dcefe9] text-[#176557]', red: 'bg-[#ffebe7] text-[#a84335]', ink: 'bg-[#e8eaf2] text-[#303952]' };
  return <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[accent]}`}>{<Icon size={19} />}</span>{trend && <span className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-secondary' : 'text-accent'}`}>{trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} week on week</span>}</div><p className="mt-5 text-xs font-semibold text-muted-foreground">{label}</p><p data-testid={`text-stat-${label.toLowerCase().replaceAll(' ', '-')}`} className="mt-1 font-display text-3xl font-extrabold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

export function PosPage() {
  const queryClient = useQueryClient();
  const productsQuery = useListProducts({ query: { queryKey: getListProductsQueryKey(), staleTime: 60_000 } });
  const createOrder = useCreateOrder();
  const { queue, add, remove } = useOfflineQueue();
  const isFlushingQueue = useRef(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderInputPaymentMethod>('Cash');
  const [cash, setCash] = useState('');
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const products = productsQuery.data ?? fallbackProducts;
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter((p) => p.isAvailable && (category === 'All' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));
  const cartItems = products.filter((p) => cart[p.id]).map((p) => ({ ...p, quantity: cart[p.id] }));
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cashValue = Number(cash) || 0;

  useEffect(() => {
    const syncQueue = () => {
      if (!navigator.onLine || !queue.length || isFlushingQueue.current) return;
      isFlushingQueue.current = true;
      let remaining = queue.length;
      queue.forEach((queued) => {
        const { localId, createdAt: _createdAt, ...orderData } = queued;
        createOrder.mutate({ data: orderData }, {
          onSuccess: () => {
            remove(localId);
            remaining -= 1;
            if (!remaining) {
              isFlushingQueue.current = false;
              setNotice({ message: 'Offline tickets synced. Your ledger is current.', tone: 'success' });
            }
          },
          onError: () => {
            remaining -= 1;
            if (!remaining) isFlushingQueue.current = false;
          },
        });
      });
    };
    window.addEventListener('online', syncQueue);
    syncQueue();
    return () => window.removeEventListener('online', syncQueue);
  }, [queue, remove]);

  const addItem = (product: Product) => setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }));
  const changeQty = (id: number, delta: number) => setCart((current) => {
    const next = Math.max(0, (current[id] ?? 0) + delta);
    const copy = { ...current };
    if (next === 0) delete copy[id]; else copy[id] = next;
    return copy;
  });
  const completePayment = () => {
    if (!cartItems.length) { setNotice({ message: 'Add an item before taking payment.', tone: 'error' }); return; }
    if (paymentMethod === 'Cash' && cashValue < total) { setNotice({ message: `Cash is short by ${money(total - cashValue)}.`, tone: 'error' }); return; }
    const order = { items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })), totalAmount: total, paymentMethod, cashTendered: paymentMethod === 'Cash' ? cashValue : null, offlineId: `counter-${Date.now()}` };
    if (!navigator.onLine) {
      add(order);
      setCart({});
      setCash('');
      setNotice({ message: 'Saved on this device. It will sync when you are back online.', tone: 'success' });
      return;
    }
    createOrder.mutate({ data: order }, {
      onSuccess: () => { setCart({}); setCash(''); setNotice({ message: 'Payment complete. Receipt is ready.', tone: 'success' }); queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); },
      onError: () => { add(order); setCart({}); setCash(''); setNotice({ message: 'Network missed it. Order saved offline for sync.', tone: 'success' }); },
    });
  };

  return <div className="animate-rise">
    <PageHeading eyebrow="Counter · Shift open" title="Ready when the line is." detail="Tap a dish, take the payment, keep moving. Your cart stays on this device if the signal goes quiet." action={<div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground"><Clock3 size={15} className="text-primary" />{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })}</div>} />
    {queue.length > 0 && <div data-testid="status-offline-queue" className="mb-5 flex items-center gap-3 rounded-xl border border-[#edca91] bg-[#fff5e5] px-4 py-3 text-sm text-[#825016]"><WifiOffIcon /><span><strong>{queue.length} order{queue.length > 1 ? 's' : ''} waiting to sync.</strong> Keep serving; Ulamify will send them when the connection returns.</span></div>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input data-testid="input-product-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a dish or drink…" className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></div><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} data-testid={`button-category-${item.toLowerCase()}`} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>{item}</button>)}</div></div>
        {productsQuery.isLoading ? <LoadingBlocks /> : productsQuery.isError && !productsQuery.data ? <div data-testid="state-products-error" className="rounded-2xl border border-[#e6b2a9] bg-[#fff0ed] p-6 text-sm text-[#9e382c]"><p className="font-bold">Menu could not load.</p><p className="mt-1">Showing the last known counter menu. Try again when ready.</p><button data-testid="button-retry-products" onClick={() => productsQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2 text-xs font-bold"><RefreshCw size={14} />Try again</button></div> : filtered.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filtered.map((product, index) => <button key={product.id} data-testid={`button-add-product-${product.id}`} onClick={() => addItem(product)} className="group relative flex min-h-[154px] flex-col justify-between overflow-hidden rounded-2xl border border-card-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md active:translate-y-0"><span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full" style={{ background: product.accent ?? '#e97b45' }} /><span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold" style={{ background: `${product.accent ?? '#e97b45'}18`, color: product.accent ?? '#e97b45' }}>{product.name.slice(0, 1)}</span><span><span className="mt-3 block text-sm font-bold leading-tight">{product.name}</span><span className="mt-1 block font-mono-ui text-sm font-medium text-muted-foreground">{money(product.price)}</span></span><span className="mt-3 flex items-center gap-1 text-[11px] font-bold text-secondary opacity-0 transition group-hover:opacity-100"><Plus size={13} />Add to order</span></button>)}</div> : <EmptyState title="No dishes found" detail="Try another search or switch categories." icon={Search} />}
      </section>
      <aside className="sticky top-[94px] rounded-2xl border border-[#d5c9af] bg-card shadow-md">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Current order</p><h3 className="mt-1 font-display text-xl font-bold">{cartItems.length ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''}` : 'Nothing queued'}</h3></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground"><Receipt size={17} /></span></div>
        {cartItems.length ? <div className="max-h-[280px] overflow-y-auto px-5 py-2">{cartItems.map((item) => <div key={item.id} data-testid={`row-cart-item-${item.id}`} className="flex items-center gap-3 border-b border-border/70 py-3 last:border-0"><div className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold" style={{ background: `${item.accent ?? '#e97b45'}18`, color: item.accent ?? '#e97b45' }}>{item.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="font-mono-ui text-xs text-muted-foreground">{money(item.price * item.quantity)}</p></div><div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1"><button data-testid={`button-decrease-item-${item.id}`} onClick={() => changeQty(item.id, -1)} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"><Minus size={13} /></button><span className="w-5 text-center text-xs font-bold">{item.quantity}</span><button data-testid={`button-increase-item-${item.id}`} onClick={() => changeQty(item.id, 1)} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted"><Plus size={13} /></button></div></div>)}</div> : <div className="px-5 py-10 text-center"><ShoppingBasket size={25} className="mx-auto text-muted-foreground/40" /><p className="mt-3 text-sm font-semibold">Your next order starts here.</p><p className="mt-1 text-xs text-muted-foreground">Choose from the menu to build a ticket.</p></div>}
        <div className="border-t border-border bg-background/50 px-5 py-4"><div className="mb-3 flex items-end justify-between"><span className="text-sm font-semibold text-muted-foreground">Total</span><span data-testid="text-cart-total" className="font-display text-3xl font-extrabold">{money(total)}</span></div><div className="mb-3 grid grid-cols-3 gap-2">{(['Cash', 'GCash', 'Maya'] as const).map((method) => <button key={method} data-testid={`button-payment-${method.toLowerCase()}`} onClick={() => setPaymentMethod(method)} className={`rounded-lg border py-2 text-xs font-bold ${paymentMethod === method ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-card text-muted-foreground hover:border-secondary/50'}`}>{method === 'Cash' ? <Banknote size={14} className="mx-auto mb-1" /> : <CreditCard size={14} className="mx-auto mb-1" />}{method}</button>)}</div>{paymentMethod === 'Cash' && <div className="mb-3"><label htmlFor="cash-tendered" className="mb-1.5 block text-xs font-bold text-muted-foreground">Cash received</label><input id="cash-tendered" data-testid="input-cash-tendered" inputMode="decimal" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="₱ 0.00" className="h-10 w-full rounded-lg border border-input bg-card px-3 font-mono-ui text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{cashValue >= total && total > 0 && <p className="mt-1.5 text-right text-xs font-bold text-secondary">Change {money(cashValue - total)}</p>}</div>}<button data-testid="button-complete-payment" disabled={createOrder.isPending} onClick={completePayment} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"><Check size={17} />{createOrder.isPending ? 'Saving order…' : 'Take payment'}</button></div>
      </aside>
    </div>
    {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
  </div>;
}

function WifiOffIcon() { return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4d8ac] text-[#8b591e]"><AlertTriangle size={16} /></span>; }

export function DashboardPage() {
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 45_000 } });
  const ordersQuery = useListOrders({ limit: 6 }, { query: { queryKey: getListOrdersQueryKey({ limit: 6 }), staleTime: 45_000 } });
  const summary: DashboardSummary = summaryQuery.data ?? { todaySales: 0, orderCount: 0, averageOrder: 0, pendingOrders: 0, lowStockCount: 0, expenseTotal: 0, topProduct: null };
  const orders = ordersQuery.data ?? [];
  return <div className="animate-rise">
    <PageHeading eyebrow="Wednesday · July 24, 2024" title="The day at a glance." detail="A clean read on your counter, your kitchen, and what needs your eye before lunch rush." action={<button data-testid="button-refresh-dashboard" onClick={() => { summaryQuery.refetch(); ordersQuery.refetch(); }} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:border-primary"><RefreshCw size={15} />Refresh</button>} />
    {summaryQuery.isLoading ? <LoadingBlocks /> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Sales today" value={compactMoney(summary.todaySales)} detail="gross counter sales" icon={TrendingUp} trend="up" /><StatCard label="Orders served" value={String(summary.orderCount)} detail={`avg. ${money(summary.averageOrder)} per ticket`} icon={Receipt} accent="teal" trend="up" /><StatCard label="To prepare" value={String(summary.pendingOrders)} detail="orders need kitchen eyes" icon={Clock3} accent="orange" /><StatCard label="Expenses" value={compactMoney(summary.expenseTotal)} detail="logged from palengke" icon={WalletCards} accent="red" /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm md:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Shift pulse</p><h3 className="mt-1 font-display text-2xl font-bold">Healthy start, watch the noon lift.</h3></div><span className="rounded-full bg-[#dcefe9] px-3 py-1 text-xs font-bold text-[#176557]">On track</span></div><div className="mt-8 flex h-44 items-end gap-2 border-b border-border pb-0">{[38, 52, 47, 66, 58, 78, 64, 88, 74, 98, 82, 91].map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className={`w-full max-w-[34px] rounded-t-md transition hover:opacity-80 ${index === 9 ? 'bg-primary' : 'bg-[#e8d7af]'}`} style={{ height: `${height}%` }} /><span className="font-mono-ui text-[9px] text-muted-foreground">{index + 8}am</span></div>)}</div><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>Counter rhythm · last 4 hours</span><span className="font-mono-ui text-foreground">{money(summary.todaySales)} gross</span></div></section><section className="rounded-2xl border border-card-border bg-sidebar p-5 text-sidebar-foreground shadow-sm md:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/55">Small signals</p><h3 className="mt-1 font-display text-2xl font-bold">Keep the line moving.</h3></div><AlertTriangle size={19} className="text-sidebar-primary" /></div><div className="mt-6 space-y-3"><div className="flex items-center justify-between rounded-xl bg-sidebar-accent p-3"><span className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary"><ShoppingBasket size={16} /></span>Low stock watch</span><span className="font-display text-xl font-bold text-sidebar-primary">{summary.lowStockCount}</span></div><div className="flex items-center justify-between rounded-xl bg-sidebar-accent p-3"><span className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary"><Utensils size={16} /></span>Top dish</span><span className="max-w-[110px] truncate text-right text-xs font-bold text-sidebar-foreground/75">{summary.topProduct ?? 'Not yet set'}</span></div></div><Link href="/kitchen" data-testid="link-dashboard-kitchen" className="mt-6 flex items-center justify-between border-t border-sidebar-border pt-4 text-xs font-bold text-sidebar-primary">Open kitchen board <ChevronRight size={15} /></Link></section></div><section className="mt-6 rounded-2xl border border-card-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Latest tickets</p><h3 className="mt-1 font-display text-xl font-bold">Recent counter activity</h3></div><Link href="/orders" data-testid="link-dashboard-orders" className="text-xs font-bold text-secondary">See all orders <ChevronRight size={14} className="inline" /></Link></div><OrderRows orders={orders} /></section></>}</div>;
}

function OrderRows({ orders }: { orders: Order[] }) {
  if (!orders.length) return <div className="p-5"><EmptyState title="No tickets yet today" detail="Completed payments will show up here." /></div>;
  return <div className="divide-y divide-border">{orders.map((order) => <div key={order.id} data-testid={`row-order-${order.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-muted font-mono-ui text-[10px] font-medium">{order.id.slice(-3)}</span><div className="min-w-[160px] flex-1"><p className="text-sm font-bold">{order.items.map((item) => item.name).join(', ')}</p><p className="mt-0.5 text-xs text-muted-foreground">{time(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p></div><span className="rounded-full bg-[#dcefe9] px-2.5 py-1 text-[11px] font-bold text-[#176557]">{order.paymentMethod}</span><span className="font-mono-ui text-sm font-medium">{money(order.totalAmount)}</span><span className={`text-[11px] font-bold ${order.synced ? 'text-secondary' : 'text-primary'}`}>{order.synced ? 'Synced' : 'Local'}</span></div>)}</div>;
}

export function OrdersPage() {
  const ordersQuery = useListOrders({ limit: 100 }, { query: { queryKey: getListOrdersQueryKey({ limit: 100 }), staleTime: 30_000 } });
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const orders = (ordersQuery.data ?? []).filter((order) => (filter === 'All' || order.paymentMethod === filter) && `${order.id} ${order.items.map((item) => item.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="animate-rise"><PageHeading eyebrow="Records · Recent first" title="Every ticket, accounted for." detail="Search the shift history, verify tender, and keep your books close to the counter." action={<button data-testid="button-refresh-orders" onClick={() => ordersQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:border-primary"><RefreshCw size={15} />Refresh</button>} /><div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-order-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket or dish…" className="h-10 w-full rounded-lg bg-background pl-9 pr-3 text-sm outline-none ring-1 ring-border focus:ring-primary" /></div><div className="flex gap-2 overflow-x-auto">{['All', 'Cash', 'GCash', 'Maya'].map((item) => <button key={item} data-testid={`button-order-filter-${item.toLowerCase()}`} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>{item}</button>)}</div></div>{ordersQuery.isLoading ? <LoadingBlocks /> : ordersQuery.isError ? <div data-testid="state-orders-error" className="rounded-2xl border border-[#e6b2a9] bg-[#fff0ed] p-6 text-sm text-[#9e382c]"><p className="font-bold">The ledger is taking a moment.</p><button data-testid="button-retry-orders" onClick={() => ordersQuery.refetch()} className="mt-3 rounded-lg border border-current px-3 py-2 text-xs font-bold">Try again</button></div> : <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm"><div className="hidden grid-cols-[1.5fr_1fr_.6fr_.7fr_.6fr] gap-4 border-b border-border bg-background/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground md:grid"><span>Ticket</span><span>Time</span><span>Tender</span><span>Amount</span><span>State</span></div>{orders.length ? <div className="divide-y divide-border">{orders.map((order) => <div key={order.id} data-testid={`card-order-${order.id}`} className="grid gap-2 px-5 py-4 md:grid-cols-[1.5fr_1fr_.6fr_.7fr_.6fr] md:items-center md:gap-4"><div><p className="text-sm font-bold">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</p><p className="mt-1 font-mono-ui text-[10px] text-muted-foreground">#{order.id}</p></div><span className="text-xs text-muted-foreground">{dateLabel(order.createdAt)} · {time(order.createdAt)}</span><span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold">{order.paymentMethod}</span><span className="font-mono-ui text-sm font-medium">{money(order.totalAmount)}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${order.synced ? 'bg-[#dcefe9] text-[#176557]' : 'bg-[#fff0dc] text-[#9b5414]'}`}>{order.synced ? 'Synced' : 'Local'}</span></div>)}</div> : <div className="p-5"><EmptyState title="No tickets match" detail="Try clearing the search or payment filter." icon={Search} /></div>}</section>}</div>;
}

export function KitchenPage() {
  const productsQuery = useListProducts({ query: { queryKey: getListProductsQueryKey(), staleTime: 60_000 } });
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 45_000 } });
  const createLog = useCreateProductionLog();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const products = productsQuery.data ?? fallbackProducts;
  const [selected, setSelected] = useState<Product | null>(null);
  const [servings, setServings] = useState('10');
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const lowCount = summaryQuery.data?.lowStockCount ?? 0;
  const submitBatch = () => {
    if (!selected || Number(servings) < 1) return;
    createLog.mutate({ data: { productId: selected.id, servings: Number(servings), note: note || null } }, { onSuccess: () => { setNotice({ message: `${selected.name} batch logged for ${servings} servings.`, tone: 'success' }); setSelected(null); setNote(''); }, onError: () => setNotice({ message: 'Could not save this batch. Try again.', tone: 'error' }) });
  };
  const toggleAvailability = (product: Product) => updateProduct.mutate({ id: product.id, data: { isAvailable: !product.isAvailable } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); setNotice({ message: `${product.name} marked ${product.isAvailable ? 'unavailable' : 'available'}.`, tone: 'success' }); } });
  return <div className="animate-rise"><PageHeading eyebrow="Kitchen · Production board" title="Keep the pots honest." detail="Log batches as they leave the stove and call out what the counter should stop selling." action={<div data-testid="status-low-stock" className="flex items-center gap-2 rounded-xl border border-[#edca91] bg-[#fff5e5] px-3 py-2 text-xs font-bold text-[#825016]"><AlertTriangle size={15} />{lowCount} low-stock flags</div>} /><div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-2xl border border-card-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Menu readiness</p><h3 className="mt-1 font-display text-xl font-bold">What can leave the pass?</h3></div><button data-testid="button-refresh-kitchen" onClick={() => productsQuery.refetch()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><RefreshCw size={16} /></button></div><div className="grid gap-3 p-5 sm:grid-cols-2">{products.map((product) => <div key={product.id} data-testid={`card-kitchen-product-${product.id}`} className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg font-bold" style={{ background: `${product.accent ?? '#e97b45'}18`, color: product.accent ?? '#e97b45' }}>{product.name.slice(0, 1)}</span><button data-testid={`button-toggle-product-${product.id}`} onClick={() => toggleAvailability(product)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.isAvailable ? 'bg-[#dcefe9] text-[#176557]' : 'bg-muted text-muted-foreground'}`}>{product.isAvailable ? 'On menu' : 'Paused'}</button></div><p className="mt-3 text-sm font-bold">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.category} · {money(product.price)}</p><button data-testid={`button-log-batch-${product.id}`} onClick={() => setSelected(product)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-bold text-secondary hover:border-secondary"><Plus size={14} />Log batch</button></div>)}</div></section><section className="rounded-2xl border border-[#d5c9af] bg-[#fffaf0] p-5 shadow-sm md:p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Production log</p><h3 className="mt-1 font-display text-2xl font-bold">{selected ? selected.name : 'Choose a dish'}</h3>{selected ? <div className="mt-6 space-y-4"><div><label htmlFor="batch-servings" className="mb-1.5 block text-xs font-bold text-muted-foreground">Servings made</label><input id="batch-servings" data-testid="input-batch-servings" value={servings} onChange={(e) => setServings(e.target.value)} type="number" min="1" className="h-11 w-full rounded-xl border border-input bg-card px-3 font-mono-ui text-sm outline-none focus:border-primary" /></div><div><label htmlFor="batch-note" className="mb-1.5 block text-xs font-bold text-muted-foreground">Note <span className="font-normal">(optional)</span></label><textarea id="batch-note" data-testid="input-batch-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch pot, 12:15…" rows={3} className="w-full resize-none rounded-xl border border-input bg-card p-3 text-sm outline-none focus:border-primary" /></div><div className="flex gap-2"><button data-testid="button-cancel-batch" onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-bold">Cancel</button><button data-testid="button-save-batch" onClick={submitBatch} disabled={createLog.isPending} className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold text-secondary-foreground">{createLog.isPending ? 'Logging…' : 'Save batch'}</button></div></div> : <div className="mt-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4e6c6] text-[#9b5414]"><ChefIcon /></span><p className="mt-4 text-sm font-bold">Select a dish to log production.</p><p className="mt-1 text-xs text-muted-foreground">The kitchen team will see your entry in today’s operations trail.</p></div>}</section></div>{notice && <Notice {...notice} onClose={() => setNotice(null)} />}</div>;
}

function ChefIcon() { return <Utensils size={23} />; }

export function PurchasingPage() {
  const createExpense = useCreateExpenseLog();
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<keyof typeof ExpenseLogInputCategory>('ingredients');
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const submitExpense = () => {
    if (!Number(amount) || !details.trim()) { setNotice({ message: 'Add an amount and what it was for.', tone: 'error' }); return; }
    createExpense.mutate({ data: { amount: Number(amount), details: details.trim(), category: ExpenseLogInputCategory[category] } }, { onSuccess: () => { setAmount(''); setDetails(''); setNotice({ message: 'Palengke expense added to today’s books.', tone: 'success' }); }, onError: () => setNotice({ message: 'Could not save the expense. Try again.', tone: 'error' }) });
  };
  return <div className="animate-rise"><PageHeading eyebrow="Palengke · Expense trail" title="Know where the money went." detail="Capture the small, real purchases that keep lunch moving. No notebook archaeology at closing time." /><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-[#d5c9af] bg-[#fffaf0] p-5 shadow-sm md:p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f4e6c6] text-[#9b5414]"><ShoppingBasket size={20} /></span><h3 className="mt-5 font-display text-2xl font-bold">New expense</h3><p className="mt-1 text-sm text-muted-foreground">It takes less than a minute. Keep the detail specific.</p><div className="mt-6 space-y-4"><div><label htmlFor="expense-amount" className="mb-1.5 block text-xs font-bold text-muted-foreground">Amount</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-ui text-sm text-muted-foreground">₱</span><input id="expense-amount" data-testid="input-expense-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="h-12 w-full rounded-xl border border-input bg-card pl-8 pr-3 font-mono-ui text-lg outline-none focus:border-primary" /></div></div><div><label htmlFor="expense-details" className="mb-1.5 block text-xs font-bold text-muted-foreground">What did you buy?</label><input id="expense-details" data-testid="input-expense-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. 2kg pork, tomatoes, gas…" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary" /></div><div><p className="mb-1.5 text-xs font-bold text-muted-foreground">Category</p><div className="grid grid-cols-2 gap-2">{(['ingredients', 'supplies', 'delivery', 'other'] as const).map((item) => <button key={item} data-testid={`button-expense-category-${item}`} onClick={() => setCategory(item)} className={`rounded-lg border py-2.5 text-xs font-bold capitalize ${category === item ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-card text-muted-foreground'}`}>{item}</button>)}</div></div><button data-testid="button-save-expense" onClick={submitExpense} disabled={createExpense.isPending} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">{createExpense.isPending ? 'Saving…' : 'Add to today’s expenses'}<ArrowUpRight size={16} /></button></div></section><section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm md:p-7"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Today’s rhythm</p><h3 className="mt-1 font-display text-2xl font-bold">A tidy trail beats a tidy story.</h3></div><WalletCards className="text-secondary" size={21} /></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted p-4"><p className="text-xs font-semibold text-muted-foreground">Ingredient runs</p><p className="mt-2 font-display text-2xl font-bold">—</p><p className="mt-1 text-[11px] text-muted-foreground">Add the first one above</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs font-semibold text-muted-foreground">Last 7 days</p><p className="mt-2 font-display text-2xl font-bold">—</p><p className="mt-1 text-[11px] text-muted-foreground">Your daily view will build</p></div><div className="rounded-xl bg-[#dcefe9] p-4 text-[#176557]"><p className="text-xs font-semibold">Habit tip</p><p className="mt-2 text-sm font-bold leading-snug">Log the receipt while you’re still at the palengke.</p></div></div><div className="mt-8 rounded-xl border border-dashed border-border p-5"><div className="flex gap-3"><CircleAlert className="shrink-0 text-primary" size={18} /><div><p className="text-sm font-bold">Keep details useful</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">“Pork” helps later. “Pork · 2kg · Bel-Air market” helps your next buying run.</p></div></div></div></section></div>{notice && <Notice {...notice} onClose={() => setNotice(null)} />}</div>;
}

export function SettingsPage() {
  const [storeName, setStoreName] = useState('Bayanihan Kitchen');
  const [location, setLocation] = useState('Makati');
  const [saved, setSaved] = useState(false);
  const [printer, setPrinter] = useState(false);
  return <div className="animate-rise"><PageHeading eyebrow="Workspace · Store setup" title="Make the counter yours." detail="A few details help every shift start from the same clear place." /><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm md:p-7"><div className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8eaf2] text-[#303952]"><Store size={21} /></span><div><h3 className="font-display text-2xl font-bold">Store profile</h3><p className="mt-1 text-sm text-muted-foreground">Shown to your team in the top bar.</p></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><div><label htmlFor="store-name" className="mb-1.5 block text-xs font-bold text-muted-foreground">Store name</label><input id="store-name" data-testid="input-store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" /></div><div><label htmlFor="store-location" className="mb-1.5 block text-xs font-bold text-muted-foreground">Location</label><input id="store-location" data-testid="input-store-location" value={location} onChange={(e) => setLocation(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" /></div></div><button data-testid="button-save-profile" onClick={() => setSaved(true)} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground">{saved ? 'Profile saved' : 'Save profile'}</button></section><section className="space-y-6"><div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm md:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Your role</p><h3 className="mt-1 font-display text-2xl font-bold">Manager / owner</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">You can see the full day, adjust the menu, and keep purchasing honest.</p><div className="mt-5 flex items-center gap-3 rounded-xl bg-muted p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-display font-bold text-secondary-foreground">MR</span><div><p className="text-sm font-bold">Mika Reyes</p><p className="text-xs text-muted-foreground">Primary workspace owner</p></div></div></div><div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm md:p-7"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Receipt station</p><h3 className="mt-1 font-display text-2xl font-bold">Printer readiness</h3></div><Printer size={21} className={printer ? 'text-secondary' : 'text-muted-foreground'} /></div><div className={`mt-5 flex items-center gap-3 rounded-xl p-3 ${printer ? 'bg-[#dcefe9] text-[#176557]' : 'bg-muted text-muted-foreground'}`}><span className={`h-2.5 w-2.5 rounded-full ${printer ? 'bg-secondary' : 'bg-muted-foreground/50'}`} /><p className="flex-1 text-sm font-semibold">{printer ? 'Printer test passed · Counter 01' : 'No printer test run today'}</p></div><button data-testid="button-test-printer" onClick={() => setPrinter(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold hover:border-primary"><Printer size={16} />{printer ? 'Run test again' : 'Run printer test'}</button><p className="mt-3 text-center text-[11px] text-muted-foreground">Placeholder action — connect your thermal printer when ready.</p></div></section></div></div>;
}