import { useEffect, useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AlertTriangle,
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calculator,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Lock,
  Minus,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Trash2,
  TrendingUp,
  Truck,
  UserPlus,
  UserX,
  Utensils,
  WalletCards,
  X,
} from 'lucide-react';
import {
  InventoryBaseUnit,
  InventoryPurchaseUnit,
  OrderInputPaymentMethod,
  type InventoryIngredient,
  type InventoryPurchaseUnit as InventoryPurchaseUnitType,
  type ProductCostInput,
  type RecipeIngredient,
  type PriceProposalInput,
  type Role,
  type RolePermission,
  type DashboardSummary,
  type Product,
  type ProductInputCategory,
  type Order,
  useArchiveProduct,
  useCreateProduct,
  getGetStoreProfileQueryKey,
  useGetStoreProfile,
  useUpdateStoreProfile,
  useApproveVoidRequest,
  useCreateInventoryIngredient,
  useCreateInventoryReceipt,
  useCreateInventoryAdjustment,
  useListInventoryIngredients,
  useGetProductCost,
  useUpdateProductCost,
  useCreatePriceProposal,
  useListPriceProposals,
  useReviewPriceProposal,
  useCreateOrder,
  useCreateProductionLog,
  useCreateRole,
  useCreateUser,
  useCreateVoidRequest,
  useGetDashboardSummary,
  useListOrders,
  useListProducts,
  useListRoles,
  useListUsers,
  useListVoidRequests,
  useUpdateProduct,
  useUpdateUser,
  useCreateMarketRun,
  useListMarketRuns,
  getListMarketRunsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListOrdersQueryKey,
  getListExpenseLogsQueryKey,
  getListInventoryIngredientsQueryKey,
  getListProductsQueryKey,
  getListRolesQueryKey,
  getListUsersQueryKey,
  getListVoidRequestsQueryKey,
  getListPriceProposalsQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/auth-context';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Adobo flakes',
    category: 'Ulam',
    price: 78,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#e97b45',
  },
  {
    id: 2,
    name: 'Sinigang na baboy',
    category: 'Ulam',
    price: 92,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#198274',
  },
  {
    id: 3,
    name: 'Chicken inasal',
    category: 'Ulam',
    price: 105,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#d9922e',
  },
  {
    id: 4,
    name: 'Ginisang monggo',
    category: 'Ulam',
    price: 65,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#667b54',
  },
  {
    id: 5,
    name: 'Extra rice',
    category: 'Rice',
    price: 25,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#c5a36a',
  },
  {
    id: 6,
    name: 'Iced calamansi',
    category: 'Beverage',
    price: 38,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#dfbd3f',
  },
  {
    id: 7,
    name: 'Bottled water',
    category: 'Beverage',
    price: 22,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#6a93b4',
  },
  {
    id: 8,
    name: 'Fried egg',
    category: 'Add-on',
    price: 20,
    isAvailable: true,
    stockCount: 0,
    isArchived: false,
    accent: '#e7ae3b',
  },
];

const money = (value = 0) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const roundMoney = (value: number) => Number(value.toFixed(2));
const compactMoney = (value = 0) => `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
const time = (value: string) =>
  new Date(value).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

const rolePermissionOptions: {
  value: RolePermission;
  label: string;
  description: string;
}[] = [
  {
    value: 'counter',
    label: 'Counter',
    description: 'Take orders and use the POS',
  },
  {
    value: 'dashboard',
    label: 'Today dashboard',
    description: 'View sales and daily summaries',
  },
  { value: 'orders', label: 'Orders', description: 'View and manage orders' },
  {
    value: 'kitchen',
    label: 'Kitchen',
    description: 'Access kitchen operations',
  },
  {
    value: 'purchasing',
    label: 'Palengke',
    description: 'Manage purchases and expenses',
  },
  {
    value: 'settings',
    label: 'Store settings',
    description: 'View general settings',
  },
  {
    value: 'manage-staff',
    label: 'Staff accounts',
    description: 'Create and manage staff accounts',
  },
  {
    value: 'configure-prices',
    label: 'Price configuration',
    description: 'Change menu prices',
  },
  {
    value: 'costing',
    label: 'Costs & calculator',
    description: 'Built-in Manager access; not assignable to custom roles',
  },
];

type NoticeState = { message: string; tone: 'success' | 'error' };

function useNoticeState() {
  return useState<NoticeState | null>(null);
}

function PageHeading({
  eyebrow,
  title,
  detail,
  action,
  compact = false,
  hideOnMobile = false,
  hideTextOnMobile = false,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: ReactNode;
  compact?: boolean;
  hideOnMobile?: boolean;
  hideTextOnMobile?: boolean;
}) {
  return (
    <div
      className={`${hideOnMobile ? 'hidden md:flex' : 'flex'} flex-col justify-between md:flex-row md:items-end ${compact ? 'mb-4 gap-2 md:mb-7 md:gap-4' : 'mb-7 gap-4'}`}
    >
      <div className={`${hideTextOnMobile ? 'hidden md:block' : ''} min-w-0`}>
        <p className={`eyebrow-label text-[11px] font-bold uppercase text-secondary ${compact ? 'mb-1 md:mb-2' : 'mb-2'}`}>{eyebrow}</p>
        <h2
          className={`font-display max-w-[24ch] text-balance font-bold leading-tight tracking-tight ${compact ? 'text-2xl md:text-4xl' : 'text-3xl md:text-4xl'}`}
        >
          {title}
        </h2>
        <p className={`max-w-xl leading-relaxed text-muted-foreground ${compact ? 'mt-1.5 text-xs md:mt-3 md:text-sm' : 'mt-3 text-sm'}`}>
          {detail}
        </p>
      </div>
      {action}
    </div>
  );
}

function Notice({ message, tone = 'success', onClose }: { message: string; tone?: 'success' | 'error'; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timeout = window.setTimeout(() => onCloseRef.current(), 3000);
    return () => window.clearTimeout(timeout);
  }, [message, tone]);

  return createPortal(
    <div
      role="status"
      data-testid="status-notice"
      className={`fixed inset-x-3 top-[calc(.75rem+env(safe-area-inset-top))] z-[100] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-md animate-rise sm:inset-x-auto sm:right-5 sm:top-5 ${tone === 'success' ? 'border-[#9ad2c3] bg-[#e9f7f1] text-[#176557]' : 'border-[#e6b2a9] bg-[#fff0ed] text-[#9e382c]'}`}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-current/10">
        {tone === 'success' ? <Check size={16} /> : <CircleAlert size={16} />}
      </span>
      <span className="min-w-0 flex-1">{message}</span>
      <button
        type="button"
        data-testid="button-close-notice"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-auto shrink-0 opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>,
    document.body,
  );
}

function LoadingBlocks() {
  return (
    <div data-testid="state-loading" className="grid gap-4 md:grid-cols-3">
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function hasHttpStatus(error: unknown, status: number): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === status;
}

function getApiErrorMessage(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'error' in error.data &&
    typeof error.data.error === 'string'
  ) {
    return error.data.error;
  }
  return null;
}

function EmptyState({
  title,
  detail,
  icon: Icon = Receipt,
  compact = false,
}: {
  title: string;
  detail: string;
  icon?: typeof Receipt;
  compact?: boolean;
}) {
  return (
    <div
      data-testid="state-empty"
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 text-center ${compact ? 'min-h-28 px-3 py-3 sm:min-h-44 sm:px-6 sm:py-6' : 'min-h-44 px-6 py-6'}`}
    >
      <span
        className={`grid place-items-center rounded-xl bg-muted text-muted-foreground ${compact ? 'mb-2 h-9 w-9 sm:mb-3 sm:h-11 sm:w-11' : 'mb-3 h-11 w-11'}`}
      >
        <Icon size={compact ? 16 : 19} />
      </span>
      <p className={`font-display font-bold ${compact ? 'text-base sm:text-lg' : 'text-lg'}`}>{title}</p>
      <p className={`mt-1 max-w-xs text-muted-foreground ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>{detail}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = 'orange',
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
  accent?: string;
  trend?: 'up' | 'down';
}) {
  const colors: Record<string, string> = {
    orange: 'bg-[#fff0dc] text-[#9b5414]',
    teal: 'bg-[#dcefe9] text-[#176557]',
    red: 'bg-[#ffebe7] text-[#a84335]',
    ink: 'bg-[#e8eaf2] text-[#303952]',
  };
  return (
    <div className="rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-xl sm:h-10 sm:w-10 ${colors[accent]}`}>{<Icon size={17} />}</span>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-bold sm:text-xs ${trend === 'up' ? 'text-secondary' : 'text-accent'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} week on week
          </span>
        )}
      </div>
      <p className="mt-3 text-[10px] font-semibold text-muted-foreground sm:text-xs">{label}</p>
      <p
        data-testid={`text-stat-${label.toLowerCase().replaceAll(' ', '-')}`}
        className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{detail}</p>
    </div>
  );
}

export function PosPage() {
  const queryClient = useQueryClient();
  const productsQuery = useListProducts({
    query: {
      queryKey: getListProductsQueryKey(),
      staleTime: 0,
      refetchInterval: 10_000,
    },
  });
  const createOrder = useCreateOrder();
  const { queue, add, remove } = useOfflineQueue();
  const isFlushingQueue = useRef(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderInputPaymentMethod>('Cash');
  const [cash, setCash] = useState('');
  const [notice, setNotice] = useNoticeState();
  const products = (productsQuery.data ?? fallbackProducts).filter((product) => !product.isArchived);
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter(
    (p) => p.isAvailable && (category === 'All' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const cartItems = products.filter((p) => cart[p.id]).map((p) => ({ ...p, quantity: cart[p.id] }));
  const queuedByProduct = queue.reduce<Record<number, number>>((totals, order) => {
    order.items.forEach((item) => {
      totals[item.productId] = (totals[item.productId] ?? 0) + item.quantity;
    });
    return totals;
  }, {});
  const availableStock = (product: Product) => Math.max(0, product.stockCount - (queuedByProduct[product.id] ?? 0));
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cashValue = Number(cash) || 0;

  useEffect(() => {
    const syncQueue = () => {
      if (!navigator.onLine || !queue.length || isFlushingQueue.current) return;
      isFlushingQueue.current = true;
      let remaining = queue.length;
      queue.forEach((queued) => {
        const { localId, createdAt: _createdAt, ...orderData } = queued;
        createOrder.mutate(
          { data: orderData },
          {
            onSuccess: () => {
              remove(localId);
              void queryClient.invalidateQueries({
                queryKey: getListProductsQueryKey(),
              });
              remaining -= 1;
              if (!remaining) {
                isFlushingQueue.current = false;
                setNotice({
                  message: 'Offline tickets synced. Your ledger is current.',
                  tone: 'success',
                });
              }
            },
            onError: (error) => {
              if (hasHttpStatus(error, 409)) {
                setNotice({
                  message: 'An offline ticket has more items than the current stock. Review the ticket and contact the cashier.',
                  tone: 'error',
                });
                void queryClient.invalidateQueries({
                  queryKey: getListProductsQueryKey(),
                });
              }
              remaining -= 1;
              if (!remaining) isFlushingQueue.current = false;
            },
          },
        );
      });
    };
    window.addEventListener('online', syncQueue);
    syncQueue();
    return () => window.removeEventListener('online', syncQueue);
  }, [queue, remove, queryClient, productsQuery.data]);

  const addItem = (product: Product) => {
    if ((cart[product.id] ?? 0) >= availableStock(product)) {
      setNotice({
        message: `No more ${product.name} servings are available.`,
        tone: 'error',
      });
      return;
    }
    setCart((current) => {
      if ((current[product.id] ?? 0) >= availableStock(product)) return current;
      return { ...current, [product.id]: (current[product.id] ?? 0) + 1 };
    });
  };
  const changeQty = (id: number, delta: number) => {
    const product = products.find((item) => item.id === id);
    if (delta > 0 && product && (cart[id] ?? 0) >= availableStock(product)) {
      setNotice({
        message: `No more ${product.name} servings are available.`,
        tone: 'error',
      });
      return;
    }
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      if (delta > 0 && product && next > availableStock(product)) return current;
      const copy = { ...current };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };
  const completePayment = () => {
    if (!cartItems.length) {
      setNotice({
        message: 'Add an item before taking payment.',
        tone: 'error',
      });
      return;
    }
    if (paymentMethod === 'Cash' && cashValue < total) {
      setNotice({
        message: `Cash is short by ${money(total - cashValue)}.`,
        tone: 'error',
      });
      return;
    }
    const order = {
      items: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      totalAmount: total,
      paymentMethod,
      cashTendered: paymentMethod === 'Cash' ? cashValue : null,
      offlineId: `counter-${crypto.randomUUID()}`,
    };
    if (!navigator.onLine) {
      add(order);
      setCart({});
      setCash('');
      setMobileCartOpen(false);
      setNotice({
        message: 'Saved on this device. It will sync when you are back online.',
        tone: 'success',
      });
      return;
    }
    createOrder.mutate(
      { data: order },
      {
        onSuccess: () => {
          setCart({});
          setCash('');
          setMobileCartOpen(false);
          setNotice({
            message: 'Payment complete. Receipt is ready.',
            tone: 'success',
          });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
        },
        onError: (error) => {
          if (hasHttpStatus(error, 409)) {
            void productsQuery.refetch();
            setNotice({
              message: 'Stock changed before checkout. Adjust the order to match the latest count.',
              tone: 'error',
            });
            return;
          }
          add(order);
          setCart({});
          setCash('');
          setMobileCartOpen(false);
          setNotice({
            message: 'Network missed it. Order saved offline for sync.',
            tone: 'success',
          });
        },
      },
    );
  };

  const renderCartPanel = (mobile = false) => (
    <div className={`${mobile ? 'overflow-hidden bg-card' : 'overflow-hidden rounded-2xl border border-[#d5c9af] bg-card shadow-md'}`}>
      <div className={`flex items-center justify-between border-b border-border ${mobile ? 'px-3 py-2' : 'px-5 py-4'}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Current order</p>
          <h3 className={`${mobile ? 'mt-0.5 text-base' : 'mt-1 text-xl'} font-display font-bold`}>
            {cartItems.length ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''}` : 'Nothing queued'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!mobile && (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Receipt size={17} />
            </span>
          )}
          {mobile && (
            <button
              type="button"
              data-testid="button-close-mobile-cart"
              onClick={() => setMobileCartOpen(false)}
              aria-label="Close cart"
              className="grid h-8 w-8 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>
      {cartItems.length ? (
        <div className={`${mobile ? 'max-h-[28dvh] px-3 py-1' : 'max-h-[280px] px-5 py-2'} overflow-y-auto`}>
          {cartItems.map((item) => (
            <div
              key={item.id}
              data-testid={`${mobile ? 'mobile-' : ''}row-cart-item-${item.id}`}
              className={`flex items-center border-b border-border/70 last:border-0 ${mobile ? 'gap-2 py-2' : 'gap-3 py-3'}`}
            >
              <div
                className={`grid shrink-0 place-items-center rounded-lg text-xs font-bold ${mobile ? 'h-7 w-7' : 'h-9 w-9'}`}
                style={{
                  background: `${item.accent ?? '#e97b45'}18`,
                  color: item.accent ?? '#e97b45',
                }}
              >
                {item.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{item.name}</p>
                <p className="font-mono-ui text-xs text-muted-foreground">{money(item.price * item.quantity)}</p>
              </div>
              <div className={`flex items-center gap-1 rounded-lg border border-border bg-background p-1 ${mobile ? 'gap-0.5' : ''}`}>
                <button
                  data-testid={`${mobile ? 'mobile-' : ''}button-decrease-item-${item.id}`}
                  onClick={() => changeQty(item.id, -1)}
                  className={`grid place-items-center rounded text-muted-foreground hover:bg-muted ${mobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                <button
                  data-testid={`${mobile ? 'mobile-' : ''}button-increase-item-${item.id}`}
                  onClick={() => changeQty(item.id, 1)}
                  className={`grid place-items-center rounded text-muted-foreground hover:bg-muted ${mobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${mobile ? 'flex items-center gap-3 px-4 py-4 text-left' : 'px-5 py-6 text-center'}`}>
          <ShoppingBasket size={mobile ? 19 : 22} className="shrink-0 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-semibold">{mobile ? 'Your cart is empty' : 'Your next order starts here.'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {mobile ? 'Choose a dish from the menu to begin.' : 'Choose from the menu to build a ticket.'}
            </p>
          </div>
          {mobile && (
            <button type="button" onClick={() => setMobileCartOpen(false)} className="ml-auto shrink-0 text-xs font-bold text-secondary">
              Browse
            </button>
          )}
        </div>
      )}
      {(!mobile || cartItems.length > 0) && (
        <div className={`border-t border-border bg-background/50 ${mobile ? 'px-3 py-2' : 'px-5 py-4'}`}>
          <div className={`${mobile ? 'mb-2' : 'mb-3'} flex items-end justify-between`}>
            <span className="text-sm font-semibold text-muted-foreground">Total</span>
            <span
              data-testid={`${mobile ? 'mobile-' : ''}text-cart-total`}
              className={`font-display font-extrabold ${mobile ? 'text-xl' : 'text-3xl'}`}
            >
              {money(total)}
            </span>
          </div>
          <div className={`${mobile ? 'mb-2 gap-1.5' : 'mb-3 gap-2'} grid grid-cols-3`}>
            {(['Cash', 'GCash', 'Maya'] as const).map((method) => (
              <button
                key={method}
                data-testid={`${mobile ? 'mobile-' : ''}button-payment-${method.toLowerCase()}`}
                onClick={() => setPaymentMethod(method)}
                className={`rounded-lg border text-xs font-bold ${mobile ? 'py-1.5' : 'py-2'} ${paymentMethod === method ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-card text-muted-foreground hover:border-secondary/50'}`}
              >
                {method === 'Cash' ? (
                  <Banknote size={mobile ? 12 : 14} className="mx-auto mb-1" />
                ) : (
                  <CreditCard size={mobile ? 12 : 14} className="mx-auto mb-1" />
                )}
                {method}
              </button>
            ))}
          </div>
          {paymentMethod === 'Cash' && (
            <div className={`${mobile ? 'mb-2' : 'mb-3'}`}>
              <label
                htmlFor={mobile ? 'cash-tendered-mobile' : 'cash-tendered'}
                className={`${mobile ? 'mb-1' : 'mb-1.5'} block text-xs font-bold text-muted-foreground`}
              >
                Cash received
              </label>
              <input
                id={mobile ? 'cash-tendered-mobile' : 'cash-tendered'}
                data-testid={`${mobile ? 'mobile-' : ''}input-cash-tendered`}
                inputMode="decimal"
                value={cash}
                onChange={(event) => setCash(event.target.value)}
                placeholder="₱ 0.00"
                className={`w-full rounded-lg border border-input bg-card px-3 font-mono-ui text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${mobile ? 'h-9' : 'h-10'}`}
              />
              {cashValue >= total && total > 0 && (
                <p className="mt-1.5 text-right text-xs font-bold text-secondary">Change {money(cashValue - total)}</p>
              )}
            </div>
          )}
          <button
            data-testid={`${mobile ? 'mobile-' : ''}button-complete-payment`}
            disabled={createOrder.isPending || cartItems.length === 0}
            onClick={completePayment}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${mobile ? 'h-10' : 'h-12'}`}
          >
            <Check size={17} />
            {createOrder.isPending ? 'Saving order…' : 'Take payment'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        eyebrow="Counter · Shift open"
        title="Ready when the line is."
        detail="Tap a dish, take the payment, keep moving. Your cart stays on this device if the signal goes quiet."
        action={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            <Clock3 size={14} className="text-primary" />
            {new Date().toLocaleDateString('en-PH', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        }
      />
      {queue.length > 0 && (
        <div
          data-testid="status-offline-queue"
          className="mb-3 flex items-center gap-3 rounded-xl border border-[#edca91] bg-[#fff5e5] px-3 py-2 text-xs text-[#825016] md:mb-5 md:px-4 md:py-3 md:text-sm"
        >
          <WifiOffIcon />
          <span>
            <strong>
              {queue.length} order{queue.length > 1 ? 's' : ''} waiting to sync.
            </strong>{' '}
            Keep serving; Ulamify will send them when the connection returns.
          </span>
        </div>
      )}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px] md:gap-6">
        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center md:mb-4 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                data-testid="input-product-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a dish or drink…"
                className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 md:h-11 md:pl-10 md:pr-4"
              />
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  data-testid={`button-category-${item.toLowerCase()}`}
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-xl border px-3 py-1.5 text-[11px] font-bold transition md:px-3.5 md:py-2 md:text-xs ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {productsQuery.isLoading ? (
            <LoadingBlocks />
          ) : productsQuery.isError && !productsQuery.data ? (
            <div data-testid="state-products-error" className="rounded-2xl border border-[#e6b2a9] bg-[#fff0ed] p-6 text-sm text-[#9e382c]">
              <p className="font-bold">Menu could not load.</p>
              <p className="mt-1">Showing the last known counter menu. Try again when ready.</p>
              <button
                data-testid="button-retry-products"
                onClick={() => productsQuery.refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2 text-xs font-bold"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          ) : filtered.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
              {filtered.map((product) => {
                const remaining = Math.max(0, availableStock(product) - (cart[product.id] ?? 0));
                return (
                  <button
                    key={product.id}
                    data-testid={`button-add-product-${product.id}`}
                    onClick={() => addItem(product)}
                    disabled={remaining <= 0}
                    className="group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl border border-card-border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 md:min-h-[154px] md:p-4"
                  >
                    <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full" style={{ background: product.accent ?? '#e97b45' }} />
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold md:h-9 md:w-9 md:rounded-xl md:text-sm"
                      style={{
                        background: `${product.accent ?? '#e97b45'}18`,
                        color: product.accent ?? '#e97b45',
                      }}
                    >
                      {product.name.slice(0, 1)}
                    </span>
                    <span>
                      <span className="mt-2 block text-xs font-bold leading-tight md:mt-3 md:text-sm">{product.name}</span>
                      <span className="mt-1 block font-mono-ui text-xs font-medium text-muted-foreground md:text-sm">
                        {money(product.price)}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] font-bold md:mt-1 md:text-xs ${remaining === 0 ? 'text-destructive' : 'text-secondary'}`}
                      >
                        {remaining} servings left
                      </span>
                    </span>
                    <span className="mt-1 hidden items-center gap-1 text-[11px] font-bold text-secondary opacity-0 transition group-hover:opacity-100 md:mt-3 md:flex">
                      <Plus size={13} />
                      Add to order
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No dishes found" detail="Try another search or switch categories." icon={Search} />
          )}
        </section>
        <aside className="sticky top-[94px] hidden rounded-2xl border border-[#d5c9af] bg-card shadow-md xl:block">
          {renderCartPanel()}
        </aside>
      </div>
      {createPortal(
        <>
          {cartItems.length > 0 && (
            <button
              type="button"
              data-testid="button-open-mobile-cart"
              onClick={() => setMobileCartOpen(true)}
              className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex min-h-14 items-center justify-between rounded-2xl border border-[#d5c9af] bg-card px-4 py-2 shadow-lg md:bottom-4 xl:hidden"
              aria-label={`Open cart with ${cartItems.length} items, total ${money(total)}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
                  <ShoppingBasket size={18} />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-bold">
                    {cartItems.length} item{cartItems.length > 1 ? 's' : ''} in cart
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">Tap to review and pay</span>
                </span>
              </span>
              <span className="shrink-0 pl-2 text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total</span>
                <span className="font-mono-ui text-sm font-bold">{money(total)}</span>
              </span>
            </button>
          )}
          {mobileCartOpen && (
            <div className="fixed inset-0 z-40 xl:hidden">
              <button
                type="button"
                data-testid="button-dismiss-mobile-cart"
                aria-label="Close cart"
                onClick={() => setMobileCartOpen(false)}
                className="absolute inset-0 bg-foreground/35"
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Current order"
                data-testid="mobile-cart-sheet"
                onClick={(event) => event.stopPropagation()}
                className="absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mx-auto max-h-[min(82dvh,44rem)] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-background p-2 pb-3 shadow-2xl md:bottom-0 md:p-3 md:pb-4"
              >
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
                {renderCartPanel(true)}
              </section>
            </div>
          )}
        </>,
        document.body,
      )}
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function WifiOffIcon() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4d8ac] text-[#8b591e]">
      <AlertTriangle size={16} />
    </span>
  );
}

export function DashboardPage() {
  const summaryQuery = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 45_000 },
  });
  const ordersQuery = useListOrders(
    { limit: 100 },
    {
      query: {
        queryKey: getListOrdersQueryKey({ limit: 100 }),
        staleTime: 45_000,
      },
    },
  );
  const summary: DashboardSummary = summaryQuery.data ?? {
    todaySales: 0,
    orderCount: 0,
    averageOrder: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    expenseTotal: 0,
    topProduct: null,
  };
  const orders = ordersQuery.data ?? [];
  const pullStart = useRef<{ x: number; y: number } | null>(null);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const refreshDashboard = async () => {
    await Promise.all([summaryQuery.refetch(), ordersQuery.refetch()]);
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(max-width: 767px)').matches || window.scrollY > 0 || event.touches.length !== 1) {
      pullStart.current = null;
      return;
    }

    const touch = event.touches[0];
    pullStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = pullStart.current;
    pullStart.current = null;
    const touch = event.changedTouches[0];
    if (
      !start ||
      !touch ||
      touch.clientY - start.y < 72 ||
      Math.abs(touch.clientY - start.y) <= Math.abs(touch.clientX - start.x) ||
      isPullRefreshing
    ) {
      return;
    }

    setIsPullRefreshing(true);
    void refreshDashboard().finally(() => setIsPullRefreshing(false));
  };

  return (
    <div
      className="animate-rise"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        pullStart.current = null;
      }}
    >
      <PageHeading
        hideOnMobile
        eyebrow="Wednesday · July 24, 2024"
        title="The day at a glance."
        detail="A clean read on your counter, your kitchen, and what needs your eye before lunch rush."
        action={
          <button
            data-testid="button-refresh-dashboard"
            onClick={refreshDashboard}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:border-primary"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      {isPullRefreshing && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-2 z-20 text-center text-xs font-semibold text-muted-foreground md:hidden"
        >
          Refreshing dashboard…
        </div>
      )}
      {summaryQuery.isLoading ? (
        <LoadingBlocks />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Sales today"
              value={compactMoney(summary.todaySales)}
              detail="gross counter sales"
              icon={TrendingUp}
              trend="up"
            />
            <StatCard
              label="Orders served"
              value={String(summary.orderCount)}
              detail={`avg. ${money(summary.averageOrder)} per ticket`}
              icon={Receipt}
              accent="teal"
              trend="up"
            />
            <StatCard
              label="To prepare"
              value={String(summary.pendingOrders)}
              detail="orders need kitchen eyes"
              icon={Clock3}
              accent="orange"
            />
            <StatCard
              label="Expenses"
              value={compactMoney(summary.expenseTotal)}
              detail="logged from palengke"
              icon={WalletCards}
              accent="red"
            />
          </div>
          <div className="mt-4 grid gap-3 md:mt-6 md:gap-6 xl:grid-cols-[1.4fr_.8fr]">
            <section className="rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Shift pulse</p>
                  <h3 className="mt-1 font-display text-xl font-bold md:text-2xl">Healthy start, watch the noon lift.</h3>
                </div>
                <span className="whitespace-nowrap rounded-full bg-[#dcefe9] px-2 py-1 text-[9px] font-bold text-[#176557] sm:px-2.5 sm:text-[10px] md:px-3 md:text-xs">
                  On track
                </span>
              </div>
              <div className="mt-4 flex h-28 items-end gap-1.5 border-b border-border pb-0 sm:mt-6 sm:h-36 sm:gap-2 md:mt-8 md:h-44">
                {[38, 52, 47, 66, 58, 78, 64, 88, 74, 98, 82, 91].map((height, index) => (
                  <div key={index} className="group flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`w-full max-w-[34px] rounded-t-md transition hover:opacity-80 ${index === 9 ? 'bg-primary' : 'bg-[#e8d7af]'}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="font-mono-ui text-[8px] text-muted-foreground sm:text-[9px]">{index + 8}am</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:mt-4 sm:text-xs">
                <span>Counter rhythm · last 4 hours</span>
                <span className="font-mono-ui text-foreground">{money(summary.todaySales)} gross</span>
              </div>
            </section>
            <section className="rounded-2xl border border-card-border bg-sidebar p-3 text-sidebar-foreground shadow-sm sm:p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/55">Small signals</p>
                  <h3 className="mt-1 font-display text-xl font-bold md:text-2xl">Keep the line moving.</h3>
                </div>
                <AlertTriangle size={17} className="text-sidebar-primary md:h-[19px] md:w-[19px]" />
              </div>
              <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3 md:mt-6">
                <div className="flex items-center justify-between rounded-xl bg-sidebar-accent p-2.5 sm:p-3">
                  <span className="flex items-center gap-2.5 text-xs font-semibold sm:gap-3 sm:text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary sm:h-8 sm:w-8">
                      <ShoppingBasket size={14} className="sm:h-4 sm:w-4" />
                    </span>
                    Low stock watch
                  </span>
                  <span className="font-display text-lg font-bold text-sidebar-primary sm:text-xl">{summary.lowStockCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-sidebar-accent p-2.5 sm:p-3">
                  <span className="flex items-center gap-2.5 text-xs font-semibold sm:gap-3 sm:text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary sm:h-8 sm:w-8">
                      <Utensils size={14} className="sm:h-4 sm:w-4" />
                    </span>
                    Top dish
                  </span>
                  <span className="max-w-[110px] truncate text-right text-[10px] font-bold text-sidebar-foreground/75 sm:text-xs">
                    {summary.topProduct ?? 'Not yet set'}
                  </span>
                </div>
              </div>
              <Link
                href="/kitchen"
                data-testid="link-dashboard-kitchen"
                className="mt-4 flex items-center justify-between border-t border-sidebar-border pt-3 text-[10px] font-bold text-sidebar-primary sm:mt-5 sm:pt-4 sm:text-xs md:mt-6"
              >
                Open kitchen board <ChevronRight size={15} />
              </Link>
            </section>
          </div>
          <section className="mt-4 overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm sm:mt-6">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-5 sm:py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Latest tickets</p>
                <h3 className="mt-1 font-display text-base font-bold sm:text-xl">Recent counter activity</h3>
              </div>
              <Link href="/orders" data-testid="link-dashboard-orders" className="shrink-0 text-[10px] font-bold text-secondary sm:text-xs">
                See all orders <ChevronRight size={12} className="inline sm:h-[14px] sm:w-[14px]" />
              </Link>
            </div>
            <OrderRows orders={orders} />
          </section>
        </>
      )}
    </div>
  );
}

function OrderRows({ orders }: { orders: Order[] }) {
  if (!orders.length)
    return (
      <div className="p-3 sm:p-5">
        <EmptyState title="No tickets yet today" detail="Completed payments will show up here." />
      </div>
    );
  return (
    <div aria-label="Recent orders" className="max-h-[45rem] divide-y divide-border overflow-y-auto touch-pan-y sm:max-h-96" tabIndex={0}>
      {orders.map((order) => (
        <div
          key={order.id}
          data-testid={`row-order-${order.id}`}
          className="flex h-[4.5rem] items-start gap-2 overflow-hidden px-3 py-2 sm:h-auto sm:items-center sm:gap-3 sm:px-5 sm:py-4"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted font-mono-ui text-[9px] sm:h-9 sm:w-9 sm:text-[10px]">
            {order.id.slice(-3)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-xs font-bold sm:text-sm">{order.items.map((item) => item.name).join(', ')}</p>
              <span className="shrink-0 rounded-full bg-[#dcefe9] px-2 py-0.5 text-[9px] font-bold text-[#176557] sm:px-2.5 sm:py-1 sm:text-[11px]">
                {order.paymentMethod}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
              {time(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono-ui text-xs font-medium sm:text-sm">{money(order.totalAmount)}</span>
              <span className={`text-[9px] font-bold sm:text-[11px] ${order.synced ? 'text-secondary' : 'text-primary'}`}>
                {order.synced ? 'Synced' : 'Local'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrdersPage() {
  const { currentUser } = useAuth();
  const isOwner = currentUser.role === 'owner';
  const queryClient = useQueryClient();

  const ordersQuery = useListOrders(
    { limit: 100 },
    {
      query: {
        queryKey: getListOrdersQueryKey({ limit: 100 }),
        staleTime: 30_000,
      },
    },
  );
  const voidRequestsQuery = useListVoidRequests({
    query: { queryKey: getListVoidRequestsQueryKey(), enabled: isOwner },
  });

  const createVoid = useCreateVoidRequest();
  const approveVoid = useApproveVoidRequest();

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useNoticeState();
  const [restockVoidIds, setRestockVoidIds] = useState<number[]>([]);

  const pendingVoidRequests = voidRequestsQuery.data ?? [];
  const orders = (ordersQuery.data ?? []).filter(
    (order) =>
      (filter === 'All' || order.paymentMethod === filter) &&
      `${order.id} ${order.items.map((item) => item.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRequestVoid = (orderId: string) => {
    createVoid.mutate(
      { id: orderId, data: { reason: 'Requested by frontline cashier' } },
      {
        onSuccess: () => {
          setNotice({
            message: `Void request submitted for Order #${orderId.slice(-3)}. Awaiting Owner approval.`,
            tone: 'success',
          });
          queryClient.invalidateQueries({
            queryKey: getListVoidRequestsQueryKey(),
          });
        },
        onError: () =>
          setNotice({
            message: 'Could not submit void request.',
            tone: 'error',
          }),
      },
    );
  };

  const handleApproveVoid = (requestId: number, approved: boolean) => {
    const restockReusableItems = approved && restockVoidIds.includes(requestId);
    approveVoid.mutate(
      { id: requestId, data: { approved, restockReusableItems } },
      {
        onSuccess: () => {
          setNotice({
            message: approved
              ? restockReusableItems
                ? 'Order void approved and returned servings restored to stock.'
                : 'Order void approved. Stock was not restored.'
              : 'Void request rejected.',
            tone: 'success',
          });
          setRestockVoidIds((current) => current.filter((id) => id !== requestId));
          queryClient.invalidateQueries({
            queryKey: getListOrdersQueryKey({ limit: 100 }),
          });
          queryClient.invalidateQueries({
            queryKey: getListVoidRequestsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
        },
        onError: () =>
          setNotice({
            message: 'Could not process this void request.',
            tone: 'error',
          }),
      },
    );
  };

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Records · Recent first"
        title="Every ticket, accounted for."
        detail="Search the shift history, verify tender, and keep your books close to the counter."
        action={
          <button
            data-testid="button-refresh-orders"
            onClick={() => {
              ordersQuery.refetch();
              if (isOwner) voidRequestsQuery.refetch();
            }}
            className="self-start inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* Void Requests Panel for Owner */}
      {isOwner && pendingVoidRequests.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-700/50 dark:bg-amber-950/20 sm:mb-6 sm:p-5">
          <div className="flex flex-col gap-1 border-b border-amber-200 pb-2 dark:border-amber-800 sm:flex-row sm:items-center sm:justify-between sm:pb-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-200 sm:text-sm">
              <AlertTriangle size={16} />
              <span>Pending Void Override Requests ({pendingVoidRequests.length})</span>
            </div>
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 sm:text-xs">Owner Approval Required</span>
          </div>
          <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
            {pendingVoidRequests.map((vr) => (
              <div
                key={vr.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-white p-2.5 shadow-sm dark:border-amber-800 dark:bg-amber-900/10 sm:gap-3 sm:p-3"
              >
                <div>
                  <p className="text-xs font-bold text-foreground sm:text-sm">
                    Order #{vr.orderId} · {vr.reason}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">
                    Requested by {vr.requestedByName ?? 'Cashier'} at {time(vr.createdAt)}
                  </p>
                  <label className="mt-1.5 flex items-center gap-2 text-[10px] font-medium text-muted-foreground sm:mt-2 sm:text-xs">
                    <input
                      type="checkbox"
                      data-testid={`checkbox-restock-void-${vr.id}`}
                      checked={restockVoidIds.includes(vr.id)}
                      onChange={(event) =>
                        setRestockVoidIds((current) => (event.target.checked ? [...current, vr.id] : current.filter((id) => id !== vr.id)))
                      }
                      className="accent-primary"
                    />
                    Items were returned and are reusable
                  </label>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleApproveVoid(vr.id, false)}
                    className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveVoid(vr.id, true)}
                    className="rounded-lg bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground hover:brightness-95 sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    Approve Void
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:mb-5 sm:gap-3 sm:p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="input-order-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket or dish…"
            className="h-9 w-full rounded-lg bg-background pl-9 pr-3 text-xs outline-none ring-1 ring-border focus:ring-primary sm:h-10 sm:text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto sm:gap-2">
          {['All', 'Cash', 'GCash', 'Maya'].map((item) => (
            <button
              key={item}
              data-testid={`button-order-filter-${item.toLowerCase()}`}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold sm:px-3 sm:py-2 sm:text-xs ${filter === item ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {ordersQuery.isLoading ? (
        <LoadingBlocks />
      ) : ordersQuery.isError ? (
        <div
          data-testid="state-orders-error"
          className="rounded-2xl border border-[#e6b2a9] bg-[#fff0ed] p-4 text-xs text-[#9e382c] sm:p-6 sm:text-sm"
        >
          <p className="font-bold">The ledger is taking a moment.</p>
          <button
            data-testid="button-retry-orders"
            onClick={() => ordersQuery.refetch()}
            className="mt-2 rounded-lg border border-current px-3 py-1.5 text-[10px] font-bold sm:mt-3 sm:py-2 sm:text-xs"
          >
            Try again
          </button>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
          <div className="hidden grid-cols-[1.5fr_1fr_.6fr_.7fr_.6fr_.8fr] gap-4 border-b border-border bg-background/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground md:grid">
            <span>Ticket</span>
            <span>Time</span>
            <span>Tender</span>
            <span>Amount</span>
            <span>State</span>
            <span>Action</span>
          </div>
          {orders.length ? (
            <div
              aria-label="Recent orders"
              className="max-h-[42rem] divide-y divide-border overflow-y-auto touch-pan-y sm:max-h-96"
              tabIndex={0}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`card-order-${order.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 px-3 py-2 md:grid-cols-[1.5fr_1fr_.6fr_.7fr_.6fr_.8fr] md:items-center md:gap-4 md:px-5 md:py-4"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold sm:text-sm">
                      {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                    </p>
                    <p className="mt-0.5 font-mono-ui text-[9px] text-muted-foreground sm:text-[10px]">#{order.id}</p>
                  </div>
                  <span className="col-start-1 row-start-2 text-[10px] text-muted-foreground sm:text-xs md:col-auto md:row-auto">
                    {dateLabel(order.createdAt)} · {time(order.createdAt)}
                  </span>
                  <span className="col-start-2 row-start-1 h-fit w-fit self-start justify-self-end whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold sm:px-2.5 sm:py-1 sm:text-[11px] md:col-auto md:row-auto md:self-auto">
                    {order.paymentMethod}
                  </span>
                  <span className="col-start-2 row-start-2 justify-self-end font-mono-ui text-xs font-medium sm:text-sm md:col-auto md:row-auto">
                    {money(order.totalAmount)}
                  </span>
                  <span
                    className={`col-start-1 row-start-3 h-fit w-fit self-start rounded-full px-2 py-0.5 text-[9px] font-bold sm:px-2.5 sm:py-1 sm:text-[11px] md:col-auto md:row-auto md:self-auto ${order.status === 'voided' ? 'bg-destructive/20 text-destructive' : order.synced ? 'bg-[#dcefe9] text-[#176557]' : 'bg-[#fff0dc] text-[#9b5414]'}`}
                  >
                    {order.status === 'voided' ? 'Voided' : order.synced ? 'Synced' : 'Local'}
                  </span>
                  <div className="col-start-2 row-start-3 self-start justify-self-end md:col-auto md:row-auto md:self-auto">
                    {order.status !== 'voided' && (
                      <button
                        onClick={() => handleRequestVoid(order.id)}
                        disabled={createVoid.isPending}
                        className="rounded-lg border border-border px-2 py-1 text-[9px] font-bold text-muted-foreground hover:border-destructive hover:text-destructive sm:px-2.5 sm:text-[11px]"
                      >
                        Request Void
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 sm:p-5">
              <EmptyState title="No tickets match" detail="Try clearing the search or payment filter." icon={Search} compact />
            </div>
          )}
        </section>
      )}
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

export function KitchenPage() {
  const productsQuery = useListProducts({
    query: { queryKey: getListProductsQueryKey(), staleTime: 60_000 },
  });
  const createLog = useCreateProductionLog();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const products = (productsQuery.data ?? fallbackProducts).filter((product) => !product.isArchived);
  const [selected, setSelected] = useState<Product | null>(null);
  const [servings, setServings] = useState('10');
  const [note, setNote] = useState('');
  const [mobileProductionOpen, setMobileProductionOpen] = useState(false);
  const [notice, setNotice] = useNoticeState();
  const lowCount = products.filter((product) => product.stockCount <= 5).length;

  const submitBatch = () => {
    const servingCount = Number(servings);
    if (!selected || !Number.isInteger(servingCount) || servingCount < 1) {
      setNotice({
        message: 'Select a dish and enter a whole number of servings.',
        tone: 'error',
      });
      return;
    }
    createLog.mutate(
      {
        data: {
          productId: selected.id,
          servings: servingCount,
          note: note.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setSelected(null);
          setMobileProductionOpen(false);
          setNote('');
          setNotice({
            message: 'Production batch logged and stock updated.',
            tone: 'success',
          });
          void queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: getListInventoryIngredientsQueryKey(),
          });
          void queryClient.invalidateQueries({ queryKey: ['product-cost'] });
          void queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
        },
        onError: (error) =>
          setNotice({
            message: getApiErrorMessage(error) ?? 'Could not log batch. Try again.',
            tone: 'error',
          }),
      },
    );
  };

  const toggleAvailability = (product: Product) => {
    updateProduct.mutate(
      { id: product.id, data: { isAvailable: !product.isAvailable } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
          setNotice({
            message: `${product.name} is now ${!product.isAvailable ? 'available' : 'paused'}.`,
            tone: 'success',
          });
        },
        onError: () =>
          setNotice({
            message: `Could not update ${product.name}.`,
            tone: 'error',
          }),
      },
    );
  };

  const openProductionLog = (product: Product) => {
    setSelected(product);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileProductionOpen(true);
    }
  };

  const renderProductionForm = (prefix: 'desktop' | 'mobile') => {
    const suffix = prefix === 'mobile' ? '-mobile' : '';
    const isMobile = prefix === 'mobile';
    return selected ? (
      <div className={`${isMobile ? 'mt-3 space-y-2.5' : 'mt-6 space-y-4'}`}>
        <div>
          <label
            htmlFor={`batch-servings${suffix}`}
            className={`${isMobile ? 'mb-1 text-[10px]' : 'mb-1.5 text-xs'} block font-bold text-muted-foreground`}
          >
            Servings made
          </label>
          <input
            id={`batch-servings${suffix}`}
            data-testid={`input-batch-servings${suffix}`}
            value={servings}
            onChange={(event) => setServings(event.target.value)}
            type="number"
            min="1"
            step="1"
            className={`${isMobile ? 'h-10' : 'h-11'} w-full rounded-xl border border-input bg-card px-3 font-mono-ui text-sm outline-none focus:border-primary`}
          />
        </div>
        <div>
          <label
            htmlFor={`batch-note${suffix}`}
            className={`${isMobile ? 'mb-1 text-[10px]' : 'mb-1.5 text-xs'} block font-bold text-muted-foreground`}
          >
            Note <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id={`batch-note${suffix}`}
            data-testid={`input-batch-note${suffix}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. lunch pot, 12:15…"
            rows={isMobile ? 2 : 3}
            className={`${isMobile ? 'p-2.5 text-xs' : 'p-3 text-sm'} w-full resize-none rounded-xl border border-input bg-card outline-none focus:border-primary`}
          />
        </div>
        <div className="flex gap-2">
          <button
            data-testid={`button-cancel-batch${suffix}`}
            onClick={() => {
              setSelected(null);
              if (prefix === 'mobile') setMobileProductionOpen(false);
            }}
            className={`${isMobile ? 'py-2.5 text-xs' : 'py-3 text-sm'} flex-1 rounded-xl border border-border bg-card font-bold`}
          >
            Cancel
          </button>
          <button
            data-testid={`button-save-batch${suffix}`}
            onClick={submitBatch}
            disabled={createLog.isPending}
            className={`${isMobile ? 'py-2.5 text-xs' : 'py-3 text-sm'} flex-1 rounded-xl bg-secondary font-bold text-secondary-foreground disabled:opacity-50`}
          >
            {createLog.isPending ? 'Logging…' : 'Save batch'}
          </button>
        </div>
      </div>
    ) : (
      <div className="mt-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4e6c6] text-[#9b5414]">
          <ChefIcon />
        </span>
        <p className="mt-4 text-sm font-bold">Select a dish to log production.</p>
        <p className="mt-1 text-xs text-muted-foreground">The kitchen team will see your entry in today’s operations trail.</p>
      </div>
    );
  };

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Kitchen · Production board"
        title="Keep the pots honest."
        detail="Log batches as they leave the stove and call out what the counter should stop selling."
        action={
          lowCount > 0 ? (
            <div
              data-testid="status-low-stock"
              className="flex items-center gap-2 rounded-xl border border-[#edca91] bg-[#fff5e5] px-2.5 py-1.5 text-[10px] font-bold text-[#825016] sm:px-3 sm:py-2 sm:text-xs"
            >
              <AlertTriangle size={13} />
              {lowCount} low-stock flags
            </div>
          ) : undefined
        }
      />
      {lowCount > 0 && (
        <div
          data-testid="status-low-stock-mobile"
          className="mb-3 flex items-center gap-2 rounded-xl border border-[#edca91] bg-[#fff5e5] px-2.5 py-1.5 text-[10px] font-bold text-[#825016] md:hidden"
        >
          <AlertTriangle size={13} />
          {lowCount} low-stock flags
        </div>
      )}
      <div className="grid gap-3 sm:gap-6 xl:grid-cols-[1.15fr_.8fr]">
        <section className="rounded-none border-0 bg-transparent shadow-none md:rounded-2xl md:border md:border-card-border md:bg-card md:shadow-sm">
          <div className="flex items-center justify-between border-b border-border py-3 md:px-5 md:py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Menu readiness</p>
              <h3 className="mt-1 font-display text-base font-bold sm:text-xl">What can leave the pass?</h3>
            </div>
            <button
              data-testid="button-refresh-kitchen"
              onClick={() => void productsQuery.refetch()}
              disabled={productsQuery.isFetching}
              aria-label="Refresh kitchen menu"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:cursor-wait disabled:opacity-60 sm:p-2"
            >
              <RefreshCw size={14} className={`sm:h-4 sm:w-4 ${productsQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 sm:gap-3 md:p-5">
            {products.map((product) => (
              <div
                key={product.id}
                data-testid={`card-kitchen-product-${product.id}`}
                className="min-w-0 rounded-xl border border-border bg-background p-2.5 sm:p-4"
              >
                <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold sm:h-9 sm:w-9 sm:text-base"
                    style={{
                      background: `${product.accent ?? '#e97b45'}18`,
                      color: product.accent ?? '#e97b45',
                    }}
                  >
                    {product.name.slice(0, 1)}
                  </span>
                  <button
                    data-testid={`button-toggle-product-${product.id}`}
                    onClick={() => toggleAvailability(product)}
                    disabled={updateProduct.isPending}
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold disabled:opacity-50 sm:px-2.5 sm:py-1 sm:text-[10px] ${product.isAvailable ? 'bg-[#dcefe9] text-[#176557]' : 'bg-muted text-muted-foreground'}`}
                  >
                    {product.isAvailable ? 'On menu' : 'Paused'}
                  </button>
                </div>
                <p className="mt-2 truncate text-xs font-bold sm:mt-3 sm:text-sm">{product.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
                  {product.category} · {money(product.price)}
                </p>
                <p
                  data-testid={`text-stock-count-${product.id}`}
                  className={`mt-1.5 text-[9px] font-bold sm:mt-2 sm:text-xs ${product.stockCount <= 5 ? 'text-destructive' : 'text-secondary'}`}
                >
                  {product.stockCount} servings in stock
                </p>
                <button
                  data-testid={`button-log-batch-${product.id}`}
                  onClick={() => openProductionLog(product)}
                  className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-[10px] font-bold text-secondary hover:border-secondary sm:mt-4 sm:gap-2 sm:py-2 sm:text-xs"
                >
                  <Plus size={12} className="sm:h-[14px] sm:w-[14px]" />
                  Log batch
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="hidden rounded-2xl border border-[#d5c9af] bg-[#fffaf0] p-3 shadow-sm sm:p-5 md:block md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Production log</p>
          <h3 className="mt-1 font-display text-2xl font-bold">{selected ? selected.name : 'Choose a dish'}</h3>
          {renderProductionForm('desktop')}
        </section>
      </div>
      <Sheet
        open={mobileProductionOpen}
        onOpenChange={(open) => {
          setMobileProductionOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[70dvh] overflow-y-auto rounded-t-3xl border-[#d5c9af] bg-[#fffaf0] p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] md:hidden"
          data-testid="sheet-production-log"
        >
          <SheetHeader className="mb-3 pr-8 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Production log</p>
            <SheetTitle className="font-display text-xl font-bold">{selected?.name ?? 'Choose a dish'}</SheetTitle>
            <SheetDescription className="text-xs">Enter servings produced and an optional note.</SheetDescription>
          </SheetHeader>
          {renderProductionForm('mobile')}
        </SheetContent>
      </Sheet>
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

const menuCategories: ProductInputCategory[] = ['Ulam', 'Rice', 'Beverage', 'Add-on'];

export function MenuManagementPage() {
  const queryClient = useQueryClient();
  const productsQuery = useListProducts({
    query: { queryKey: getListProductsQueryKey(), staleTime: 0 },
  });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductInputCategory>('Ulam');
  const [price, setPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<Product | null>(null);
  const [notice, setNotice] = useNoticeState();
  const products = productsQuery.data ?? [];

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Ulam');
    setPrice('');
    setIsAvailable(true);
    setMobileFormOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setIsAvailable(product.isAvailable);
    setMobileFormOpen(window.matchMedia('(max-width: 767px)').matches);
  };

  const startNewItem = () => {
    resetForm();
    setMobileFormOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const numericPrice = Number(price);
    if (trimmedName.length < 2 || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setNotice({
        message: 'Enter a menu name and a price greater than zero.',
        tone: 'error',
      });
      return;
    }

    const onSuccess = (message: string) => {
      resetForm();
      setNotice({ message, tone: 'success' });
      void queryClient.invalidateQueries({
        queryKey: getListProductsQueryKey(),
      });
    };
    const onError = () =>
      setNotice({
        message: 'Could not save this menu item. Please try again.',
        tone: 'error',
      });

    if (editingId !== null) {
      updateProduct.mutate(
        {
          id: editingId,
          data: {
            name: trimmedName,
            category,
            price: numericPrice,
            isAvailable,
          },
        },
        { onSuccess: () => onSuccess('Menu item updated.'), onError },
      );
      return;
    }

    createProduct.mutate(
      {
        data: { name: trimmedName, category, price: numericPrice, isAvailable },
      },
      { onSuccess: () => onSuccess('Menu item added.'), onError },
    );
  };

  const handleArchive = (product: Product) => {
    setPendingArchive(product);
  };

  const confirmArchive = () => {
    if (!pendingArchive || archiveProduct.isPending) return;
    const product = pendingArchive;
    archiveProduct.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          setPendingArchive(null);
          if (editingId === product.id) resetForm();
          setNotice({
            message: `${product.name} was removed from the active menu.`,
            tone: 'success',
          });
          void queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
        },
        onError: () => {
          setPendingArchive(null);
          setNotice({
            message: `Could not archive ${product.name}.`,
            tone: 'error',
          });
        },
      },
    );
  };

  const handleRestore = (product: Product) => {
    updateProduct.mutate(
      { id: product.id, data: { isArchived: false, isAvailable: true } },
      {
        onSuccess: () => {
          setNotice({
            message: `${product.name} was restored to the menu.`,
            tone: 'success',
          });
          void queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
        },
        onError: () =>
          setNotice({
            message: `Could not restore ${product.name}.`,
            tone: 'error',
          }),
      },
    );
  };

  const isSaving = createProduct.isPending || updateProduct.isPending || archiveProduct.isPending;
  const renderMenuForm = (mobile = false) => (
    <>
      <div className="border-b border-border pb-3 sm:pb-4">
        <h3 className="font-display text-xl font-bold sm:text-2xl">{editingId === null ? 'Add a menu item' : 'Edit menu item'}</h3>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Set the item name, category, price and menu status.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3 sm:mt-5 sm:space-y-4">
        <div>
          <label
            htmlFor={`menu-item-name${mobile ? '-mobile' : ''}`}
            className="mb-1 block text-[10px] font-bold text-muted-foreground sm:mb-1.5 sm:text-xs"
          >
            Item name
          </label>
          <input
            id={`menu-item-name${mobile ? '-mobile' : ''}`}
            data-testid={`input-menu-item-name${mobile ? '-mobile' : ''}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary sm:h-11 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor={`menu-item-category${mobile ? '-mobile' : ''}`}
            className="mb-1 block text-[10px] font-bold text-muted-foreground sm:mb-1.5 sm:text-xs"
          >
            Category
          </label>
          <select
            id={`menu-item-category${mobile ? '-mobile' : ''}`}
            data-testid={`select-menu-item-category${mobile ? '-mobile' : ''}`}
            value={category}
            onChange={(event) => setCategory(menuCategories.find((item) => item === event.target.value) ?? 'Ulam')}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary sm:h-11 sm:text-sm"
          >
            {menuCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`menu-item-price${mobile ? '-mobile' : ''}`}
            className="mb-1 block text-[10px] font-bold text-muted-foreground sm:mb-1.5 sm:text-xs"
          >
            Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-ui text-sm text-muted-foreground">₱</span>
            <input
              id={`menu-item-price${mobile ? '-mobile' : ''}`}
              data-testid={`input-menu-item-price${mobile ? '-mobile' : ''}`}
              type="number"
              min="0.01"
              step="0.01"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background pl-8 pr-3 font-mono-ui text-xs outline-none focus:border-primary sm:h-11 sm:text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium sm:text-sm">
          <input
            type="checkbox"
            data-testid={`checkbox-menu-item-available${mobile ? '-mobile' : ''}`}
            checked={isAvailable}
            onChange={(event) => setIsAvailable(event.target.checked)}
            className="accent-primary"
          />
          Available to sell
        </label>
        <div className="flex gap-2 pt-1 sm:pt-2">
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold sm:py-3 sm:text-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            data-testid={`button-save-menu-item${mobile ? '-mobile' : ''}`}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50 sm:py-3 sm:text-sm"
          >
            {editingId === null ? <Plus size={16} /> : <Check size={16} />}
            {isSaving ? 'Saving…' : editingId === null ? 'Add item' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Administration · Menu"
        title="Manage your menu."
        detail="Add dishes, update item details and prices, or archive items while keeping their sales history."
      />
      <div className="grid items-start gap-3 sm:gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="hidden rounded-2xl border border-card-border bg-card p-5 shadow-sm md:block md:p-7">{renderMenuForm()}</section>

        <section className="rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-card-border md:bg-card md:p-7 md:shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3 sm:pb-4">
            <div>
              <h3 className="font-display text-xl font-bold sm:text-2xl">Menu items</h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Archived items are hidden from the Counter but can be restored.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid="button-add-menu-item-mobile"
                onClick={startNewItem}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground md:hidden"
              >
                <Plus size={13} />
                Add
              </button>
              <button
                type="button"
                data-testid="button-refresh-menu"
                onClick={() => void productsQuery.refetch()}
                disabled={productsQuery.isFetching}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:cursor-wait disabled:opacity-60 sm:p-2"
                aria-label="Refresh menu"
              >
                <RefreshCw size={14} className={`sm:h-4 sm:w-4 ${productsQuery.isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="mt-3 max-h-[min(900px,calc(100dvh-13rem))] touch-pan-y space-y-2 overflow-y-auto pr-1 sm:mt-5 sm:space-y-3">
            {productsQuery.isLoading && (
              <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">Loading menu items…</p>
            )}
            {productsQuery.isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs sm:p-4 sm:text-sm">
                <p className="font-semibold text-destructive">Could not load menu items.</p>
                <button type="button" onClick={() => void productsQuery.refetch()} className="mt-2 font-bold underline underline-offset-2">
                  Try again
                </button>
              </div>
            )}
            {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
                No menu items yet. Add your first item using the form.
              </p>
            )}
            {!productsQuery.isLoading &&
              !productsQuery.isError &&
              products.map((product) => (
                <article
                  key={product.id}
                  data-testid={`card-menu-item-${product.id}`}
                  className={`flex flex-nowrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 sm:gap-3 sm:p-4 ${product.isArchived ? 'opacity-70' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold sm:text-sm">{product.name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
                      {product.category} · {money(product.price)} · {product.stockCount} servings
                    </p>
                    <span
                      className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold sm:mt-2 sm:px-2.5 sm:py-1 sm:text-[10px] ${product.isArchived ? 'bg-muted text-muted-foreground' : product.isAvailable ? 'bg-[#dcefe9] text-[#176557]' : 'bg-[#fff0dc] text-[#9b5414]'}`}
                    >
                      {product.isArchived ? 'Archived' : product.isAvailable ? 'Available' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {product.isArchived ? (
                      <button
                        type="button"
                        data-testid={`button-restore-menu-item-${product.id}`}
                        onClick={() => handleRestore(product)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-2 text-[10px] font-bold text-secondary disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:text-xs"
                      >
                        <RotateCcw size={12} className="sm:h-[14px] sm:w-[14px]" />
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          data-testid={`button-edit-menu-item-${product.id}`}
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground sm:gap-1.5 sm:px-3 sm:text-xs"
                        >
                          <Pencil size={12} className="sm:h-[14px] sm:w-[14px]" />
                          Edit
                        </button>
                        <button
                          type="button"
                          data-testid={`button-archive-menu-item-${product.id}`}
                          onClick={() => handleArchive(product)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-2 text-[10px] font-bold text-destructive disabled:opacity-50 sm:gap-1.5 sm:px-3 sm:text-xs"
                        >
                          <Archive size={12} className="sm:h-[14px] sm:w-[14px]" />
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>
      <Sheet
        open={mobileFormOpen}
        onOpenChange={(open) => {
          setMobileFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
          data-testid="sheet-menu-item-form"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{editingId === null ? 'Add a menu item' : 'Edit menu item'}</SheetTitle>
            <SheetDescription>Enter the menu item name, category, price, and availability.</SheetDescription>
          </SheetHeader>
          {renderMenuForm(true)}
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => {
          if (!open && !archiveProduct.isPending) setPendingArchive(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm gap-4 rounded-2xl border-border bg-card p-5 sm:p-6">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-display text-lg font-bold">Remove menu item?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Remove <strong className="text-foreground">{pendingArchive?.name}</strong> from the active menu? Its order history will
              be kept, and you can restore the item later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2">
            <AlertDialogCancel disabled={archiveProduct.isPending} className="mt-0 h-10 rounded-lg px-4 text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveProduct.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmArchive();
              }}
              className="h-10 rounded-lg bg-destructive px-4 text-xs font-bold text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveProduct.isPending ? 'Removing…' : 'Remove item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function ChefIcon() {
  return <Utensils size={23} />;
}

const inventoryUnitFromMarketUnit = (unit: string): { baseUnit: InventoryBaseUnit; factor: number } | null => {
  switch (unit) {
    case 'kg':
      return { baseUnit: InventoryBaseUnit.g, factor: 1000 };
    case 'g':
      return { baseUnit: InventoryBaseUnit.g, factor: 1 };
    case 'L':
      return { baseUnit: InventoryBaseUnit.ml, factor: 1000 };
    case 'ml':
      return { baseUnit: InventoryBaseUnit.ml, factor: 1 };
    case 'each':
      return { baseUnit: InventoryBaseUnit.each, factor: 1 };
    default:
      return null;
  }
};

export function InventoryPage() {
  const queryClient = useQueryClient();
  const inventoryQuery = useListInventoryIngredients({
    query: { queryKey: getListInventoryIngredientsQueryKey(), staleTime: 30_000 },
  });
  const marketRunsQuery = useListMarketRuns({
    query: { queryKey: getListMarketRunsQueryKey(), staleTime: 30_000 },
  });
  const createInventoryIngredient = useCreateInventoryIngredient();
  const createInventoryReceipt = useCreateInventoryReceipt();
  const createInventoryAdjustment = useCreateInventoryAdjustment();
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<InventoryIngredient | null>(null);
  const [selectedMarketItemKey, setSelectedMarketItemKey] = useState('');
  const [receiptIngredientId, setReceiptIngredientId] = useState('');
  const [receiptQuantity, setReceiptQuantity] = useState('');
  const [receiptUnit, setReceiptUnit] = useState<InventoryPurchaseUnitType>('kg');
  const [receiptCost, setReceiptCost] = useState('');
  const [receiptSupplier, setReceiptSupplier] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentCost, setAdjustmentCost] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [notice, setNotice] = useNoticeState();
  const inventoryIngredients = inventoryQuery.data ?? [];
  const existingIngredientByName = new Map(inventoryIngredients.map((ingredient) => [ingredient.name.trim().toLowerCase(), ingredient]));
  const unlinkedMarketItems = [...(marketRunsQuery.data ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((run) =>
      run.items
        .filter((item) => item.itemType === 'major_ingredient' && !item.ingredientId && inventoryUnitFromMarketUnit(item.unit))
        .map((item) => ({ run, item, key: `${run.id}:${item.id}` })),
    )
    .filter(({ item }) => {
      const unit = inventoryUnitFromMarketUnit(item.unit);
      const existing = existingIngredientByName.get(item.name.trim().toLowerCase());
      return (
        item.name.trim().length > 0 &&
        (!existing || (existing.baseUnit === unit?.baseUnit && existing.latestUnitCost === 0))
      );
    })
    .filter((entry, _, entries) => {
      const index = entries.findIndex(
        ({ item }) => item.name.trim().toLowerCase() === entry.item.name.trim().toLowerCase(),
      );
      return entries.indexOf(entry) === index;
    });
  const selectedMarketItem = unlinkedMarketItems.find(({ key }) => key === selectedMarketItemKey);
  const selectedUnitDetails = selectedMarketItem ? inventoryUnitFromMarketUnit(selectedMarketItem.item.unit) : null;
  const selectedExistingIngredient = selectedMarketItem
    ? existingIngredientByName.get(selectedMarketItem.item.name.trim().toLowerCase())
    : undefined;
  const selectedReceiptIngredient = inventoryIngredients.find((item) => item.id === Number(receiptIngredientId));
  const compatiblePurchaseUnits: InventoryPurchaseUnitType[] =
    selectedReceiptIngredient?.baseUnit === 'g'
      ? [InventoryPurchaseUnit.kg, InventoryPurchaseUnit.g]
      : selectedReceiptIngredient?.baseUnit === 'ml'
        ? [InventoryPurchaseUnit.L, InventoryPurchaseUnit.ml]
        : [InventoryPurchaseUnit.each];

  const invalidateInventory = () => {
    void queryClient.invalidateQueries({ queryKey: getListInventoryIngredientsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListExpenseLogsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: ['product-cost'] });
  };

  const submitInventoryIngredient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMarketItem) {
      setNotice({ message: 'Choose an unlinked Palengke ingredient.', tone: 'error' });
      return;
    }
    const unitDetails = inventoryUnitFromMarketUnit(selectedMarketItem.item.unit);
    if (!unitDetails) {
      setNotice({ message: 'The Palengke item uses an unsupported unit.', tone: 'error' });
      return;
    }
    const quantityDelta = selectedMarketItem.item.quantity * unitDetails.factor;
    const unitCost =
      (selectedMarketItem.item.baseCost + selectedMarketItem.item.allocatedDeliveryCost) / quantityDelta;
    if (!Number.isFinite(quantityDelta) || quantityDelta <= 0 || !Number.isFinite(unitCost) || unitCost <= 0) {
      setNotice({ message: 'The selected Palengke item has invalid quantity or cost data.', tone: 'error' });
      return;
    }

    const importMarketStock = (ingredientId: number, isNewIngredient: boolean) => {
      createInventoryAdjustment.mutate(
        {
          data: {
            ingredientId,
            quantityDelta,
            unitCost,
            notes: `Imported from Palengke Run #${selectedMarketItem.run.id}`,
          },
        },
        {
          onSuccess: () => {
            setSelectedMarketItemKey('');
            setIngredientOpen(false);
            invalidateInventory();
            setNotice({ message: 'Palengke stock and landed cost added to inventory.', tone: 'success' });
          },
          onError: () =>
            setNotice({
              message: isNewIngredient
                ? 'Ingredient was created, but its Palengke stock could not be imported. Record the stock manually.'
                : 'Could not add the Palengke stock to this ingredient. Check available quantity and try again.',
              tone: 'error',
            }),
        },
      );
    };

    if (selectedExistingIngredient) {
      importMarketStock(selectedExistingIngredient.id, false);
      return;
    }

    createInventoryIngredient.mutate(
      { data: { name: selectedMarketItem.item.name.trim(), baseUnit: unitDetails.baseUnit } },
      {
        onSuccess: (created) => importMarketStock(created.id, true),
        onError: () => setNotice({ message: 'Could not add ingredient. It may already exist.', tone: 'error' }),
      },
    );
  };

  const submitInventoryReceipt = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receiptIngredientId) {
      setNotice({ message: 'Choose an inventory ingredient.', tone: 'error' });
      return;
    }
    createInventoryReceipt.mutate(
      {
        data: {
          ingredientId: Number(receiptIngredientId),
          quantity: Number(receiptQuantity),
          unit: receiptUnit,
          totalCost: Number(receiptCost),
          supplier: receiptSupplier.trim() || null,
          notes: receiptNotes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setReceiptOpen(false);
          setReceiptQuantity('');
          setReceiptCost('');
          setReceiptSupplier('');
          setReceiptNotes('');
          invalidateInventory();
          setNotice({ message: 'Ingredient stock and expense recorded.', tone: 'success' });
        },
        onError: () => setNotice({ message: 'Could not record purchase. Check its unit and amount.', tone: 'error' }),
      },
    );
  };

  const submitInventoryAdjustment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjustmentTarget) return;
    const quantity = Number(adjustmentQuantity);
    if (!Number.isFinite(quantity) || quantity === 0 || !adjustmentNotes.trim()) {
      setNotice({ message: 'Enter a non-zero quantity adjustment and a reason.', tone: 'error' });
      return;
    }
    createInventoryAdjustment.mutate(
      {
        data: {
          ingredientId: adjustmentTarget.id,
          quantityDelta: quantity,
          unitCost: quantity > 0 && adjustmentCost ? Number(adjustmentCost) : undefined,
          notes: adjustmentNotes.trim(),
        },
      },
      {
        onSuccess: () => {
          setAdjustmentTarget(null);
          setAdjustmentQuantity('');
          setAdjustmentCost('');
          setAdjustmentNotes('');
          invalidateInventory();
          setNotice({ message: 'Inventory adjustment recorded.', tone: 'success' });
        },
        onError: () => setNotice({ message: 'Could not adjust stock. Check available quantity.', tone: 'error' }),
      },
    );
  };

  return (
    <div className="animate-rise">
      <PageHeading
        compact
        hideTextOnMobile
        eyebrow="Stock control"
        title="Ingredient inventory"
        detail="Set up ingredients once, then record purchases and stock changes here."
        action={
          <div className="flex w-full min-w-0 items-center gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => setIngredientOpen(true)}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-[11px] font-bold text-secondary transition hover:border-secondary sm:h-10 sm:px-3 sm:text-xs md:flex-none"
            >
              <Plus size={14} /> <span className="whitespace-nowrap">Add from Palengke</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!receiptIngredientId && inventoryIngredients[0]) setReceiptIngredientId(String(inventoryIngredients[0].id));
                setReceiptOpen(true);
              }}
              disabled={inventoryIngredients.length === 0}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 text-[11px] font-bold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-3 sm:text-xs md:flex-none"
            >
              <Plus size={14} /> <span className="whitespace-nowrap">Record stock</span>
            </button>
          </div>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold sm:text-xl">Tracked ingredients</h3>
            <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
              {inventoryIngredients.length} {inventoryIngredients.length === 1 ? 'ingredient' : 'ingredients'}
            </p>
          </div>
        </div>
        {inventoryQuery.isLoading ? (
          <div className="p-3 sm:p-5">
            <LoadingBlocks />
          </div>
        ) : inventoryQuery.isError ? (
          <div className="p-3 text-xs text-destructive sm:p-5 sm:text-sm">
            <p className="font-bold">Ingredient inventory could not load.</p>
            <button
              type="button"
              onClick={() => void inventoryQuery.refetch()}
              className="mt-2 rounded-lg border border-current px-3 py-1.5 text-[10px] font-bold sm:py-2 sm:text-xs"
            >
              Retry
            </button>
          </div>
        ) : inventoryIngredients.length === 0 ? (
          <div className="p-2 sm:p-5">
            <EmptyState
              title="No ingredients yet"
              detail="Add an ingredient to the inventory, then record its first purchase as stock."
              icon={ShoppingBasket}
              compact
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {inventoryIngredients.map((ingredient) => (
              <article
                key={ingredient.id}
                data-testid={`row-inventory-ingredient-${ingredient.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold sm:text-sm">{ingredient.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
                    {ingredient.latestUnitCost > 0
                      ? `${money(ingredient.latestUnitCost)} / ${ingredient.baseUnit}`
                      : 'No purchase price yet'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono-ui text-xs font-bold sm:text-sm">
                    {ingredient.quantityAvailable.toLocaleString('en-PH', { maximumFractionDigits: 3 })}
                  </p>
                  <p className="text-[9px] text-muted-foreground sm:text-[10px]">{ingredient.baseUnit} on hand</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustmentQuantity('');
                    setAdjustmentCost('');
                    setAdjustmentNotes('');
                    setAdjustmentTarget(ingredient);
                  }}
                  className="inline-flex h-8 shrink-0 items-center rounded-lg border border-border px-2.5 text-[10px] font-bold text-muted-foreground transition hover:border-primary hover:text-foreground sm:h-9 sm:px-3 sm:text-xs"
                >
                  Adjust
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={ingredientOpen}
        onOpenChange={(open) => {
          setIngredientOpen(open);
          if (!open) setSelectedMarketItemKey('');
        }}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="font-display text-lg font-bold">Add ingredient from Palengke</DialogTitle>
            <DialogDescription className="text-xs">
              Choose an unlinked Palengke ingredient to add its stock and landed cost to inventory for costing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInventoryIngredient} className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground">
              Ingredient name
              {marketRunsQuery.isLoading ? (
                <span className="mt-1 block rounded-lg border border-input px-3 py-2.5 text-xs font-normal text-muted-foreground">
                  Loading Palengke items…
                </span>
              ) : marketRunsQuery.isError ? (
                <span className="mt-1 block rounded-lg border border-destructive/40 px-3 py-2.5 text-xs font-normal text-destructive">
                  Could not load Palengke items.{' '}
                  <button type="button" onClick={() => void marketRunsQuery.refetch()} className="font-bold underline">
                    Retry
                  </button>
                </span>
              ) : unlinkedMarketItems.length > 0 ? (
                <UiSelect
                  value={selectedMarketItemKey}
                  onValueChange={(value) => {
                    setSelectedMarketItemKey(value);
                  }}
                >
                  <SelectTrigger className="mt-1 h-10 bg-background text-sm">
                    <SelectValue placeholder="Select a Palengke item" />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedMarketItems.map(({ run, item, key }) => (
                      <SelectItem key={key} value={key}>
                        {item.name} · {item.quantity} {item.unit} · {money(item.baseCost + item.allocatedDeliveryCost)} · {dateLabel(run.createdAt)}
                        {run.supplier ? ` · ${run.supplier}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UiSelect>
              ) : (
                <span className="mt-1 block rounded-lg border border-input px-3 py-2.5 text-xs font-normal text-muted-foreground">
                  No compatible unlinked Palengke ingredients available. Log a market trip with a major ingredient first.
                </span>
              )}
            </label>
            <label className="block text-xs font-bold text-muted-foreground">
              Base unit
              <span className="mt-1 block rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground">
                {selectedUnitDetails?.baseUnit === InventoryBaseUnit.g
                  ? 'Grams (g)'
                  : selectedUnitDetails?.baseUnit === InventoryBaseUnit.ml
                    ? 'Milliliters (ml)'
                    : selectedUnitDetails?.baseUnit === InventoryBaseUnit.each
                      ? 'Each (pcs)'
                      : 'Select an item to set its unit'}
              </span>
            </label>
            <button
              type="submit"
              disabled={
                createInventoryIngredient.isPending ||
                createInventoryAdjustment.isPending ||
                !selectedMarketItem ||
                inventoryQuery.isLoading ||
                inventoryQuery.isError ||
                marketRunsQuery.isLoading ||
                marketRunsQuery.isError
              }
              className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {createInventoryIngredient.isPending || createInventoryAdjustment.isPending
                ? 'Adding stock…'
                : selectedExistingIngredient
                  ? 'Add stock to inventory'
                  : 'Add ingredient & stock'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="font-display text-lg font-bold">Record ingredient purchase</DialogTitle>
            <DialogDescription className="text-xs">This creates a FIFO stock lot and a matching expense entry.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInventoryReceipt} className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground">
              Ingredient
              <UiSelect
                value={receiptIngredientId}
                onValueChange={(value) => {
                  setReceiptIngredientId(value);
                  const selected = inventoryIngredients.find((item) => item.id === Number(value));
                  if (selected?.baseUnit === 'g') setReceiptUnit(InventoryPurchaseUnit.kg);
                  else if (selected?.baseUnit === 'ml') setReceiptUnit(InventoryPurchaseUnit.L);
                  else if (selected?.baseUnit === 'each') setReceiptUnit(InventoryPurchaseUnit.each);
                }}
              >
                <SelectTrigger className="mt-1 h-10 bg-background text-sm">
                  <SelectValue placeholder="Choose ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryIngredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={String(ingredient.id)}>
                      {ingredient.name} ({ingredient.baseUnit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </UiSelect>
            </label>
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <label className="block text-xs font-bold text-muted-foreground">
                Quantity
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={receiptQuantity}
                  onChange={(event) => setReceiptQuantity(event.target.value)}
                  placeholder="e.g. 2"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs font-bold text-muted-foreground">
                Unit
                <UiSelect value={receiptUnit} onValueChange={(value) => setReceiptUnit(value as InventoryPurchaseUnitType)}>
                  <SelectTrigger className="mt-1 h-10 bg-background text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {compatiblePurchaseUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </UiSelect>
              </label>
            </div>
            <label className="block text-xs font-bold text-muted-foreground">
              Total paid (₱)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={receiptCost}
                onChange={(event) => setReceiptCost(event.target.value)}
                placeholder="e.g. 740.00"
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono-ui text-sm text-foreground"
              />
            </label>
            <label className="block text-xs font-bold text-muted-foreground">
              Supplier (optional)
              <input
                maxLength={120}
                value={receiptSupplier}
                onChange={(event) => setReceiptSupplier(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="block text-xs font-bold text-muted-foreground">
              Notes (optional)
              <input
                maxLength={500}
                value={receiptNotes}
                onChange={(event) => setReceiptNotes(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={createInventoryReceipt.isPending}
              className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {createInventoryReceipt.isPending ? 'Recording…' : 'Record purchase'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustmentTarget !== null} onOpenChange={(open) => !open && setAdjustmentTarget(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="font-display text-lg font-bold">Adjust {adjustmentTarget?.name} stock</DialogTitle>
            <DialogDescription className="text-xs">
              Use a positive quantity to add stock or a negative quantity for spoilage/corrections. Unit: {adjustmentTarget?.baseUnit}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInventoryAdjustment} className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground">
              Quantity change ({adjustmentTarget?.baseUnit})
              <input
                required
                type="number"
                step="0.001"
                value={adjustmentQuantity}
                onChange={(event) => setAdjustmentQuantity(event.target.value)}
                placeholder="e.g. -0.5"
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            {Number(adjustmentQuantity) > 0 && (
              <label className="block text-xs font-bold text-muted-foreground">
                Cost per {adjustmentTarget?.baseUnit} (₱{adjustmentTarget?.latestUnitCost ? ', optional' : ', required'})
                <input
                  type="number"
                  required={adjustmentTarget?.latestUnitCost === 0}
                  min="0.0001"
                  step="0.0001"
                  value={adjustmentCost}
                  onChange={(event) => setAdjustmentCost(event.target.value)}
                  placeholder={adjustmentTarget?.latestUnitCost ? `Use latest: ${adjustmentTarget.latestUnitCost}` : 'Enter unit cost'}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
            )}
            <label className="block text-xs font-bold text-muted-foreground">
              Reason
              <input
                required
                maxLength={500}
                value={adjustmentNotes}
                onChange={(event) => setAdjustmentNotes(event.target.value)}
                placeholder="e.g. spoiled or opening stock"
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={createInventoryAdjustment.isPending}
              className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {createInventoryAdjustment.isPending ? 'Saving…' : 'Save adjustment'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

type MarketItemDraft = {
  ingredientId: string;
  itemType: 'major_ingredient' | 'pantry_item' | 'utility_lpg' | 'other_expense';
  name: string;
  quantity: string;
  unit: InventoryPurchaseUnitType;
  totalCost: string;
};

const newMarketItemDraft = (): MarketItemDraft => ({
  ingredientId: '',
  itemType: 'major_ingredient',
  name: '',
  quantity: '',
  unit: 'kg',
  totalCost: '',
});

export function PurchasingPage() {
  const queryClient = useQueryClient();
  const inventoryQuery = useListInventoryIngredients({
    query: { queryKey: getListInventoryIngredientsQueryKey(), staleTime: 30_000 },
  });
  const marketRunsQuery = useListMarketRuns({
    query: { queryKey: getListMarketRunsQueryKey(), staleTime: 30_000 },
  });
  const createMarketRun = useCreateMarketRun();
  const [marketRunOpen, setMarketRunOpen] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');
  const [marketSupplier, setMarketSupplier] = useState('');
  const [marketDeliveryFee, setMarketDeliveryFee] = useState('');
  const [marketNotes, setMarketNotes] = useState('');
  const [marketItems, setMarketItems] = useState<MarketItemDraft[]>([newMarketItemDraft()]);
  const [notice, setNotice] = useNoticeState();
  const inventoryIngredients = inventoryQuery.data ?? [];
  const marketRuns = marketRunsQuery.data ?? [];
  const filteredMarketRuns = marketRuns.filter((run) =>
    `${run.id} ${run.supplier ?? ''} ${run.notes ?? ''} ${run.items.map((item) => item.name).join(' ')}`
      .toLowerCase()
      .includes(marketSearch.trim().toLowerCase()),
  );

  const invalidateInventory = () => {
    void queryClient.invalidateQueries({ queryKey: getListInventoryIngredientsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListExpenseLogsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListMarketRunsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: ['product-cost'] });
  };

  const addMarketItemRow = () => {
    setMarketItems((current) => [...current, newMarketItemDraft()]);
  };

  const removeMarketItemRow = (index: number) => {
    if (marketItems.length === 1) return;
    setMarketItems((current) => current.filter((_, i) => i !== index));
  };

  const updateMarketItemRow = (index: number, updates: Partial<MarketItemDraft>) => {
    setMarketItems((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        return { ...row, ...updates };
      }),
    );
  };

  const submitMarketRun = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validItems = marketItems.filter(
      (item) => item.name.trim() && Number(item.quantity) > 0 && Number(item.totalCost) > 0,
    );
    if (validItems.length === 0) {
      setNotice({ message: 'Add at least one valid item with name, quantity, and cost.', tone: 'error' });
      return;
    }
    const deliveryFeeNum = Number(marketDeliveryFee) || 0;
    createMarketRun.mutate(
      {
        data: {
          supplier: marketSupplier.trim() || null,
          deliveryFee: deliveryFeeNum,
          notes: marketNotes.trim() || null,
          items: validItems.map((item) => ({
            ingredientId: item.ingredientId ? Number(item.ingredientId) : null,
            itemType: item.itemType,
            name: item.name.trim(),
            quantity: Number(item.quantity),
            unit: item.unit,
            totalCost: Number(item.totalCost),
          })),
        },
      },
      {
        onSuccess: () => {
          setMarketRunOpen(false);
          setMarketSupplier('');
          setMarketDeliveryFee('');
          setMarketNotes('');
          setMarketItems([newMarketItemDraft()]);
          invalidateInventory();
          setNotice({ message: 'Palengke Market Run logged! Landed costs prorated & stock updated.', tone: 'success' });
        },
        onError: () => setNotice({ message: 'Could not log market run. Check item details.', tone: 'error' }),
      },
    );
  };

  const marketDeliveryFeeNum = Number(marketDeliveryFee) || 0;
  const marketMajorTotal = marketItems
    .filter((item) => item.itemType === 'major_ingredient')
    .reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const marketItemsTotal = marketItems.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const marketGrandTotal = marketItemsTotal + marketDeliveryFeeNum;

  return (
    <div className="animate-rise">
      <PageHeading
        compact
        hideTextOnMobile
        eyebrow="Purchasing history · Recent first"
        title="Market trips"
        detail="Review market purchases, landed costs, and delivery fares."
        action={
          <div className="flex w-full min-w-0 items-center gap-2 md:w-auto">
            <div className="relative min-w-0 flex-1 md:w-56 md:flex-none">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                data-testid="input-market-run-search"
                value={marketSearch}
                onChange={(event) => setMarketSearch(event.target.value)}
                placeholder="Search trips…"
                aria-label="Search market trips"
                className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 md:h-10 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setMarketRunOpen(true)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-95 md:h-10 sm:px-4"
            >
              <Plus size={14} /> <span className="whitespace-nowrap">Log Palengke Run</span>
            </button>
          </div>
        }
      />
      {marketRunsQuery.isLoading ? (
        <LoadingBlocks />
      ) : marketRunsQuery.isError ? (
        <div className="rounded-2xl border border-[#e6b2a9] bg-[#fff0ed] p-4 text-xs text-[#9e382c] sm:p-6 sm:text-sm">
          <p className="font-bold">Market trips could not load.</p>
          <button
            type="button"
            onClick={() => void marketRunsQuery.refetch()}
            className="mt-2 rounded-lg border border-current px-3 py-1.5 text-[10px] font-bold sm:py-2 sm:text-xs"
          >
            Try again
          </button>
        </div>
      ) : marketRuns.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:p-5">
          <EmptyState title="No market trips yet" detail="Log a Palengke run to keep purchases and landed costs together." icon={ShoppingBag} compact />
        </div>
      ) : filteredMarketRuns.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:p-5">
          <EmptyState title="No trips match" detail="Try another supplier or item name." icon={Search} compact />
        </div>
      ) : (
        <div aria-label="Recent market trips" className="space-y-2.5 sm:space-y-3">
          {filteredMarketRuns.map((run) => (
            <article
              key={run.id}
              data-testid={`card-market-run-${run.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:gap-x-4 sm:p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold sm:text-sm">
                  {run.supplier ? `Supplier: ${run.supplier}` : `Market Run #${run.id}`}
                  <span className="font-medium text-muted-foreground"> · {run.items.length} {run.items.length === 1 ? 'item' : 'items'}</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                  {dateLabel(run.createdAt)} · {time(run.createdAt)}
                  {run.deliveryFee > 0 && <> · Delivery fare {money(run.deliveryFee)}</>}
                </p>
              </div>
              <strong className="row-span-2 self-start whitespace-nowrap font-mono-ui text-xs font-bold sm:text-sm">
                {money(run.totalAmount)}
              </strong>
              <div className="col-span-1 flex flex-wrap gap-1.5 pr-1">
                {run.items.map((item) => (
                  <span key={item.id} className="inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-full bg-muted px-2.5 py-1 text-[9px] text-muted-foreground sm:text-[10px]">
                    <span className="font-bold text-foreground">{item.name}</span>
                    <span>({item.quantity} {item.unit}) · {money(item.baseCost)}</span>
                    {item.allocatedDeliveryCost > 0 && (
                      <span className="font-semibold text-secondary">+{money(item.allocatedDeliveryCost)} fare</span>
                    )}
                  </span>
                ))}
              </div>
              {run.notes && (
                <p className="col-span-1 text-[10px] text-muted-foreground sm:text-xs">
                  Note: {run.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <Dialog open={marketRunOpen} onOpenChange={setMarketRunOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="text-secondary" size={20} /> Log market trip
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a batch market trip. Delivery fare will be prorated automatically across major ingredients to calculate accurate landed costs per dish.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitMarketRun} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                  Supplier / Vendor (optional)
                </label>
                <input
                  value={marketSupplier}
                  onChange={(e) => setMarketSupplier(e.target.value)}
                  placeholder="e.g. Dading Stall, Mega Market"
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                  Delivery / Transport Fare (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={marketDeliveryFee}
                  onChange={(e) => setMarketDeliveryFee(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 font-mono-ui text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Purchased Items ({marketItems.length})</span>
                <button
                  type="button"
                  onClick={addMarketItemRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Plus size={14} /> Add Line Item
                </button>
              </div>

              <div className="space-y-2">
                {marketItems.map((item, index) => {
                  const itemCostNum = Number(item.totalCost) || 0;
                  const itemShare = item.itemType === 'major_ingredient' && marketMajorTotal > 0 && marketDeliveryFeeNum > 0
                    ? (itemCostNum / marketMajorTotal) * marketDeliveryFeeNum
                    : 0;
                  const landedTotal = itemCostNum + itemShare;

                  return (
                    <div key={index} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 items-center">
                        <div className="sm:col-span-4">
                          <label className="mb-1 block text-[9px] font-bold text-muted-foreground">Item Name / Ingredient</label>
                          <input
                            value={item.name}
                            onChange={(e) => updateMarketItemRow(index, { name: e.target.value })}
                            placeholder="e.g. Pork Belly, Cooking Oil, LPG"
                            required
                            className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:border-primary"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-[9px] font-bold text-muted-foreground">Category</label>
                          <select
                            value={item.itemType}
                            onChange={(e) => updateMarketItemRow(index, { itemType: e.target.value as MarketItemDraft['itemType'] })}
                            className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs outline-none focus:border-primary"
                          >
                            <option value="major_ingredient">Major Ingredient</option>
                            <option value="pantry_item">Pantry Essential</option>
                            <option value="utility_lpg">Utility / Cooking Gas</option>
                            <option value="other_expense">Other Expense</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[9px] font-bold text-muted-foreground">Quantity & Unit</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateMarketItemRow(index, { quantity: e.target.value })}
                              placeholder="Qty"
                              required
                              className="h-9 w-full min-w-0 rounded-lg border border-input bg-card px-2 text-xs font-mono-ui outline-none focus:border-primary"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => updateMarketItemRow(index, { unit: e.target.value as InventoryPurchaseUnitType })}
                              className="h-9 rounded-lg border border-input bg-card px-1 text-xs outline-none focus:border-primary"
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                              <option value="each">each</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[9px] font-bold text-muted-foreground">Total Cost (₱)</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.totalCost}
                            onChange={(e) => updateMarketItemRow(index, { totalCost: e.target.value })}
                            placeholder="0.00"
                            required
                            className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs font-mono-ui outline-none focus:border-primary"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                          {marketItems.length > 1 && (
                            <button
                              type="button"
                              aria-label={`Remove item ${index + 1}`}
                              onClick={() => removeMarketItemRow(index)}
                              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.ingredientId === '' && inventoryIngredients.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground">Link to catalog ingredient:</span>
                          <select
                            value={item.ingredientId}
                            onChange={(e) => {
                              const ingredientId = e.target.value;
                              const ingredient = inventoryIngredients.find((candidate) => candidate.id === Number(ingredientId));
                              updateMarketItemRow(index, {
                                ingredientId,
                                ...(ingredient
                                  ? {
                                      name: ingredient.name,
                                      unit: ingredient.baseUnit === 'g' ? 'kg' : ingredient.baseUnit === 'ml' ? 'L' : 'each',
                                    }
                                  : {}),
                              });
                            }}
                            className="h-7 rounded border border-input bg-card px-2 text-[10px] outline-none"
                          >
                            <option value="">-- Match existing ingredient --</option>
                            {inventoryIngredients.map((ing) => (
                              <option key={ing.id} value={String(ing.id)}>
                                {ing.name} ({ing.baseUnit})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {itemShare > 0 && (
                        <p className="border-t border-border/50 pt-2 text-[10px] font-semibold text-secondary">
                          Delivery share +{money(itemShare)} · Landed cost {money(landedTotal)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-muted-foreground">Trip Notes (optional)</label>
              <textarea
                value={marketNotes}
                onChange={(e) => setMarketNotes(e.target.value)}
                placeholder="e.g. Bought at Mega Market morning shift"
                rows={2}
                className="w-full rounded-xl border border-input bg-card p-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Items subtotal</p>
                  <p className="mt-1 font-mono-ui font-bold text-foreground">{money(marketItemsTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Delivery fare</p>
                  <p className="mt-1 font-mono-ui font-bold text-foreground">{money(marketDeliveryFeeNum)}</p>
                </div>
                <div className="col-span-2 border-t border-border pt-2 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                  <p className="text-[10px] font-semibold text-muted-foreground">Trip total</p>
                  <p className="mt-1 font-mono-ui text-sm font-extrabold text-foreground">{money(marketGrandTotal)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMarketRunOpen(false)}
                className="h-10 rounded-xl border border-border px-4 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMarketRun.isPending}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:brightness-95 disabled:opacity-50"
              >
                {createMarketRun.isPending ? 'Saving…' : 'Save market trip'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

const newRecipeIngredient = (): RecipeIngredient => ({
  name: '',
  quantity: 1,
  unit: 'g',
  unitCost: 0,
});

export function CostingPage() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isOwner = currentUser.role === 'owner';
  const productsQuery = useListProducts({
    query: { queryKey: getListProductsQueryKey(), staleTime: 30_000 },
  });
  const inventoryQuery = useListInventoryIngredients({
    query: { queryKey: getListInventoryIngredientsQueryKey(), staleTime: 30_000 },
  });
  const inventoryIngredients = inventoryQuery.data ?? [];
  const products = (productsQuery.data ?? []).filter((product) => !product.isArchived);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [ingredientFormMode, setIngredientFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);
  const [ingredientDraft, setIngredientDraft] = useState<RecipeIngredient>(newRecipeIngredient());
  const [costSettingsOpen, setCostSettingsOpen] = useState(false);
  const [packagingCost, setPackagingCost] = useState('0');
  const [laborCost, setLaborCost] = useState('0');
  const [overheadCost, setOverheadCost] = useState('0');
  const [pricingMethod, setPricingMethod] = useState<PriceProposalInput['pricingMethod']>('margin');
  const [targetValue, setTargetValue] = useState('30');
  const [notice, setNotice] = useNoticeState();
  const costQuery = useGetProductCost(selectedProductId ?? 0, {
    query: {
      queryKey: ['product-cost', selectedProductId],
      enabled: selectedProductId !== null,
    },
  });
  const updateCost = useUpdateProductCost();
  const createProposal = useCreatePriceProposal();
  const proposalsQuery = useListPriceProposals({
    query: { queryKey: getListPriceProposalsQueryKey(), staleTime: 15_000 },
  });
  const reviewProposal = useReviewPriceProposal();

  useEffect(() => {
    if (selectedProductId === null && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!costQuery.data || costQuery.data.productId !== selectedProductId) return;
    setIngredients(costQuery.data.ingredients);
    setIngredientFormMode(null);
    setEditingIngredientIndex(null);
    setPackagingCost(String(costQuery.data.packagingCost));
    setLaborCost(String(costQuery.data.laborCost));
    setOverheadCost(String(costQuery.data.overheadCost));
  }, [costQuery.data, selectedProductId]);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const openAddIngredientForm = () => {
    setIngredientDraft(newRecipeIngredient());
    setEditingIngredientIndex(null);
    setIngredientFormMode('add');
  };
  const openEditIngredientForm = (index: number) => {
    setIngredientDraft({ ...ingredients[index] });
    setEditingIngredientIndex(index);
    setIngredientFormMode('edit');
  };
  const saveIngredientDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedIngredient = inventoryIngredients.find((item) => item.id === ingredientDraft.ingredientId);
    const quantity = Number(ingredientDraft.quantity);
    if (!selectedIngredient || !Number.isFinite(quantity) || quantity <= 0) {
      setNotice({ message: 'Choose a catalog ingredient and enter a valid per-serving quantity.', tone: 'error' });
      return;
    }
    const ingredient = {
      ingredientId: selectedIngredient.id,
      name: selectedIngredient.name,
      unit: selectedIngredient.baseUnit,
      quantity: Number(quantity.toFixed(3)),
      unitCost: selectedIngredient.latestUnitCost,
    };
    if (ingredientFormMode === 'edit' && editingIngredientIndex !== null) {
      setIngredients((current) =>
        current.map((item, index) => (index === editingIngredientIndex ? ingredient : item)),
      );
    } else {
      setIngredients((current) => [...current, ingredient]);
    }
    setIngredientFormMode(null);
    setEditingIngredientIndex(null);
  };
  const persistedIngredients = costQuery.data?.ingredients ?? [];
  const currentIngredients = ingredients
    .filter((ingredient) => ingredient.name.trim())
    .map((ingredient) => ({
      ingredientId: ingredient.ingredientId ?? null,
      name: ingredient.name.trim(),
      quantity: Number(Number(ingredient.quantity).toFixed(3)),
      unit: ingredient.unit.trim(),
    }));
  const savedIngredientValues = persistedIngredients.map((ingredient) => ({
    ingredientId: ingredient.ingredientId ?? null,
    name: ingredient.name.trim(),
    quantity: Number(Number(ingredient.quantity).toFixed(3)),
    unit: ingredient.unit.trim(),
  }));
  const costsAreSaved =
    costQuery.data?.productId === selectedProductId &&
    JSON.stringify(currentIngredients) === JSON.stringify(savedIngredientValues) &&
    roundMoney(Number(packagingCost)) === costQuery.data.packagingCost &&
    roundMoney(Number(laborCost)) === costQuery.data.laborCost &&
    roundMoney(Number(overheadCost)) === costQuery.data.overheadCost;
  const ingredientCost = ingredients.reduce(
    (total, ingredient) => total + Number((Number(ingredient.quantity) || 0).toFixed(3)) * roundMoney(Number(ingredient.unitCost) || 0),
    0,
  );
  const totalCost = roundMoney(ingredientCost + (Number(packagingCost) || 0) + (Number(laborCost) || 0) + (Number(overheadCost) || 0));
  const target = Number((Number(targetValue) / 100).toFixed(4));
  const canCalculate = totalCost > 0 && Number.isFinite(target) && target > 0 && (pricingMethod === 'margin' ? target < 0.95 : target <= 5);
  const suggestedPrice = canCalculate
    ? Number((pricingMethod === 'margin' ? totalCost / (1 - target) : totalCost * (1 + target)).toFixed(2))
    : 0;
  const estimatedProfit = suggestedPrice - totalCost;
  const estimatedMargin = suggestedPrice > 0 ? estimatedProfit / suggestedPrice : 0;

  const saveCosts = () => {
    if (selectedProductId === null) return;
    const payload: ProductCostInput = {
      ingredients: ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) => ({
          ...ingredient,
          name: ingredient.name.trim(),
          unit: ingredient.unit.trim(),
          quantity: Number(Number(ingredient.quantity).toFixed(3)),
          unitCost: roundMoney(Number(ingredient.unitCost)),
        })),
      packagingCost: roundMoney(Number(packagingCost) || 0),
      laborCost: roundMoney(Number(laborCost) || 0),
      overheadCost: roundMoney(Number(overheadCost) || 0),
    };
    if (
      payload.ingredients.some(
        (ingredient) =>
          !ingredient.unit ||
          !Number.isFinite(ingredient.quantity) ||
          ingredient.quantity <= 0 ||
          !Number.isFinite(ingredient.unitCost) ||
          ingredient.unitCost < 0,
      ) ||
      [payload.packagingCost, payload.laborCost, payload.overheadCost].some((value) => !Number.isFinite(value) || value < 0)
    ) {
      setNotice({
        message: 'Check each ingredient quantity and cost before saving.',
        tone: 'error',
      });
      return;
    }
    updateCost.mutate(
      { productId: selectedProductId, data: payload },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: ['product-cost', selectedProductId],
          });
          void queryClient.invalidateQueries({
            queryKey: getListPriceProposalsQueryKey(),
          });
          setCostSettingsOpen(false);
          setNotice({ message: 'Recipe costs saved.', tone: 'success' });
        },
        onError: () =>
          setNotice({
            message: 'Could not save recipe costs. Try again.',
            tone: 'error',
          }),
      },
    );
  };

  const submitProposal = () => {
    if (selectedProductId === null || !canCalculate) return;
    createProposal.mutate(
      {
        data: {
          productId: selectedProductId,
          pricingMethod,
          targetValue: target,
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListPriceProposalsQueryKey(),
          });
          setNotice({
            message: 'Price suggestion submitted for Admin review.',
            tone: 'success',
          });
        },
        onError: () =>
          setNotice({
            message: 'Could not submit this price suggestion. Save the recipe costs and try again.',
            tone: 'error',
          }),
      },
    );
  };

  const decideProposal = (id: number, decision: 'approve' | 'reject') => {
    reviewProposal.mutate(
      { id, data: { decision } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListPriceProposalsQueryKey(),
          });
          if (decision === 'approve') {
            void queryClient.invalidateQueries({
              queryKey: getListProductsQueryKey(),
            });
          }
          setNotice({
            message: decision === 'approve' ? 'Suggested price published to the menu.' : 'Price suggestion rejected.',
            tone: 'success',
          });
        },
        onError: () =>
          setNotice({
            message: 'Could not review this suggestion. Refresh and try again.',
            tone: 'error',
          }),
      },
    );
  };

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Administration · Costs & pricing"
        title="Price with your costs in view."
        detail="Maintain per-serving recipes, calculate a target price, and submit changes for Admin approval."
      />
      {productsQuery.isError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Could not load menu products.{' '}
          <button type="button" className="font-bold underline" onClick={() => void productsQuery.refetch()}>
            Retry
          </button>
        </div>
      )}
      {products.length === 0 && !productsQuery.isLoading ? (
        <EmptyState title="No active products" detail="Add an active menu item before setting up recipe costs." icon={Calculator} />
      ) : (
        <Tabs defaultValue="recipe" className="space-y-3 sm:space-y-4">
          <TabsList aria-label="Costs and pricing sections" className="grid h-auto w-full grid-cols-3 rounded-xl p-1">
            <TabsTrigger value="recipe" className="min-h-9 px-1.5 text-[11px] sm:min-h-10 sm:px-2 sm:text-sm">
              Recipe costs
            </TabsTrigger>
            <TabsTrigger value="calculator" className="min-h-9 px-1.5 text-[11px] sm:min-h-10 sm:px-2 sm:text-sm">
              Price calculator
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="min-h-9 px-1.5 text-[11px] sm:min-h-10 sm:px-2 sm:text-sm">
              Price suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipe">
            <section className="rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-card-border md:bg-card md:p-6 md:shadow-sm">
              <div className="mb-3 space-y-2.5 sm:mb-4 sm:flex sm:items-end sm:justify-between sm:gap-3 sm:space-y-0">
                <div>
                  <h3 className="hidden font-display text-lg font-bold sm:text-xl md:block">Per-serving recipe cost</h3>
                  <p className="mt-1 hidden text-xs text-muted-foreground md:block">
                    Enter the amount used per serving and its cost per unit.
                  </p>
                </div>
                <label className="block text-[10px] font-bold text-muted-foreground sm:min-w-48 sm:text-xs">
                  Menu item
                  <UiSelect
                    value={selectedProductId === null ? undefined : String(selectedProductId)}
                    onValueChange={(value) => setSelectedProductId(Number(value))}
                  >
                    <SelectTrigger aria-label="Product for costing" className="mt-1 h-11 rounded-lg bg-background text-sm">
                      <SelectValue placeholder="Choose a menu item" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {products.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)} className="min-h-11 py-3 text-sm">
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </UiSelect>
                </label>
              </div>
              {costQuery.isLoading ? (
                <p className="py-5 text-center text-sm text-muted-foreground">Loading recipe costs…</p>
              ) : costQuery.isError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Could not load product costs.{' '}
                  <button type="button" onClick={() => void costQuery.refetch()} className="font-bold underline">
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex min-h-10 items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">
                      Ingredients <span className="font-medium text-muted-foreground">({ingredients.length})</span>
                    </p>
                    <button
                      type="button"
                      onClick={openAddIngredientForm}
                      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-secondary/10 px-3 text-xs font-bold text-secondary"
                    >
                      <Plus size={14} /> Add to recipe
                    </button>
                  </div>
                  <div className="mb-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 sm:mb-4 sm:px-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-muted-foreground">Total cost per serving</p>
                      <strong className="shrink-0 font-mono-ui text-lg font-extrabold text-foreground">{money(totalCost)}</strong>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border/70 pt-1.5">
                      <p className="min-w-0 truncate text-[10px] text-muted-foreground">
                        Ingredients {money(ingredientCost)} · Additional costs
                      </p>
                      <button
                        type="button"
                        onClick={() => setCostSettingsOpen(true)}
                        className="min-h-8 shrink-0 rounded-lg px-2.5 text-[10px] font-bold text-secondary hover:bg-secondary/10"
                      >
                        Edit additional costs
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ingredients.length > 0 ? (
                      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
                        {ingredients.map((ingredient, index) => (
                          <div key={`${selectedProductId}-${index}`} className="flex min-w-0 items-center gap-1 px-2">
                            <button
                              type="button"
                              aria-label={`Edit ${ingredient.name || `ingredient ${index + 1}`}`}
                              onClick={() => openEditIngredientForm(index)}
                              className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 py-1.5 text-left"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-foreground">
                                  {ingredient.name || `Ingredient ${index + 1}`}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                  {ingredient.quantity} {ingredient.unit} · FIFO {money(Number(ingredient.unitCost))} / {ingredient.unit}
                                  {ingredient.ingredientId
                                    ? ` · ${ingredient.availableQuantity ?? 0} ${ingredient.baseUnit ?? ingredient.unit} available`
                                    : ' · Not linked to inventory'}
                                </span>
                              </span>
                              <span className="shrink-0 text-xs font-bold text-foreground">
                                {money((Number(ingredient.quantity) || 0) * (Number(ingredient.unitCost) || 0))}
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ingredient ${index + 1}`}
                              onClick={() => {
                                setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                setIngredientFormMode(null);
                                setEditingIngredientIndex(null);
                              }}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        No ingredients added yet.
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>
          </TabsContent>

          <TabsContent value="calculator">
            <section className="rounded-2xl border border-card-border bg-card p-4 shadow-sm sm:p-6">
              <h3 className="font-display text-xl font-bold">Price calculator</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Use a target margin or markup. Your saved recipe costs for {selectedProduct?.name ?? 'this product'} are used in the
                calculation.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(['margin', 'markup'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPricingMethod(method)}
                    aria-pressed={pricingMethod === method}
                    className={`rounded-lg border py-2.5 text-xs font-bold capitalize ${pricingMethod === method ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground'}`}
                  >
                    {method === 'margin' ? 'Target margin' : 'Markup'}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-xs font-bold text-muted-foreground">
                Target {pricingMethod === 'margin' ? 'margin' : 'markup'} (%)
                <input
                  type="number"
                  min="0.01"
                  max={pricingMethod === 'margin' ? '94.99' : '500'}
                  step="0.01"
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono-ui text-sm text-foreground"
                />
              </label>
              <div className="mt-4 rounded-2xl bg-sidebar p-4 text-sidebar-foreground">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/65">
                  {selectedProduct?.name ?? 'Selected product'}
                </p>
                <p className="mt-2 text-xs text-sidebar-foreground/70">
                  Current menu price <strong className="font-mono-ui text-sidebar-foreground">{money(selectedProduct?.price)}</strong>
                </p>
                <p className="mt-2 text-xs text-sidebar-foreground/70">
                  Cost / serving <strong className="font-mono-ui text-sidebar-foreground">{money(totalCost)}</strong>
                </p>
                <p className="mt-3 font-display text-3xl font-extrabold">{canCalculate ? money(suggestedPrice) : '—'}</p>
                <p className="mt-1 text-xs text-sidebar-foreground/75">
                  {canCalculate
                    ? `${money(estimatedProfit)} estimated profit · ${(estimatedMargin * 100).toFixed(2)}% estimated margin after rounding`
                    : 'Enter a valid target and save non-zero costs.'}
                </p>
              </div>
              <button
                type="button"
                onClick={submitProposal}
                disabled={!canCalculate || !costsAreSaved || createProposal.isPending || selectedProductId === null}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUpRight size={16} />
                {createProposal.isPending ? 'Submitting…' : isOwner ? 'Submit suggestion' : 'Send to Admin for approval'}
              </button>
              {!costsAreSaved && (
                <p className="mt-2 text-center text-[10px] font-semibold text-accent">
                  Save the recipe costs before submitting this price suggestion.
                </p>
              )}
              {isOwner && (
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Approval publishes the price for future orders; past receipts remain unchanged.
                </p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="suggestions">
            <section className="rounded-2xl border border-card-border bg-card p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-display text-xl font-bold">Price suggestions</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Pending proposals require Owner/Admin review.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void proposalsQuery.refetch()}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold"
                >
                  Refresh
                </button>
              </div>
              {proposalsQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading suggestions…</p>
              ) : proposalsQuery.isError ? (
                <p className="py-5 text-center text-sm text-destructive">
                  Could not load price suggestions.{' '}
                  <button type="button" onClick={() => void proposalsQuery.refetch()} className="font-bold underline">
                    Retry
                  </button>
                </p>
              ) : (proposalsQuery.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No suggestions submitted yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {(proposalsQuery.data ?? []).map((proposal) => (
                    <article
                      key={proposal.id}
                      data-testid={`card-price-proposal-${proposal.id}`}
                      className="flex flex-col gap-3 py-4 md:flex-row md:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold">{proposal.productName}</h4>
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${proposal.status === 'pending' ? 'bg-[#fff0dc] text-[#9b5414]' : proposal.status === 'approved' ? 'bg-[#dcefe9] text-[#176557]' : 'bg-muted text-muted-foreground'}`}
                          >
                            {proposal.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {proposal.pricingMethod === 'margin' ? 'Target margin' : 'Markup'} {(proposal.targetValue * 100).toFixed(1)}% ·
                          Cost {money(proposal.costPerServing)} · Current {money(proposal.currentPrice)} → Suggested{' '}
                          <strong className="text-foreground">{money(proposal.proposedPrice)}</strong>
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Submitted by {proposal.submittedBy} ·{' '}
                          {new Date(proposal.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                          {proposal.reviewedBy ? ` · Reviewed by ${proposal.reviewedBy}` : ''}
                        </p>
                      </div>
                      {isOwner && proposal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={reviewProposal.isPending}
                            onClick={() => decideProposal(proposal.id, 'reject')}
                            className="h-9 rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={reviewProposal.isPending}
                            onClick={() => decideProposal(proposal.id, 'approve')}
                            className="h-9 rounded-lg bg-secondary px-3 text-xs font-bold text-secondary-foreground disabled:opacity-50"
                          >
                            Approve & publish
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}
      <Sheet
        open={ingredientFormMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIngredientFormMode(null);
            setEditingIngredientIndex(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[75dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-border bg-card p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:max-h-[80dvh] sm:p-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]"
          data-testid="sheet-recipe-ingredient"
        >
          <SheetHeader className="mb-2 pr-8 text-left sm:mb-3">
            <SheetTitle className="font-display text-lg font-bold sm:text-xl">
              {ingredientFormMode === 'edit' ? 'Edit recipe ingredient' : 'Add recipe ingredient'}
            </SheetTitle>
            <SheetDescription className="text-[11px] sm:text-xs">
              Enter the amount used per serving and the ingredient cost per unit.
            </SheetDescription>
          </SheetHeader>
          {inventoryQuery.isLoading ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Loading ingredient catalog…</p>
          ) : inventoryQuery.isError ? (
            <div className="py-3 text-xs text-destructive">
              Could not load inventory ingredients.{' '}
              <button type="button" onClick={() => void inventoryQuery.refetch()} className="font-bold underline">
                Retry
              </button>
            </div>
          ) : inventoryIngredients.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              Add an ingredient from a Palengke trip in Inventory before linking it to this recipe.
            </p>
          ) : (
            <form onSubmit={saveIngredientDraft} className="space-y-2 sm:space-y-2.5">
              <label className="block text-[11px] font-semibold text-muted-foreground sm:text-xs">
                Inventory ingredient
                <UiSelect
                  value={ingredientDraft.ingredientId ? String(ingredientDraft.ingredientId) : ''}
                  onValueChange={(value) => {
                    const selected = inventoryIngredients.find((item) => item.id === Number(value));
                    if (!selected) return;
                    setIngredientDraft((draft) => ({
                      ...draft,
                      ingredientId: selected.id,
                      name: selected.name,
                      unit: selected.baseUnit,
                      unitCost: selected.latestUnitCost,
                    }));
                  }}
                >
                  <SelectTrigger autoFocus aria-label="Inventory ingredient" className="mt-1 h-10 bg-background text-sm">
                    <SelectValue placeholder="Choose ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryIngredients.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name} ({item.baseUnit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UiSelect>
              </label>
              <label className="block text-[11px] font-semibold text-muted-foreground sm:text-xs">
                Quantity per serving ({ingredientDraft.unit || 'base unit'})
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={ingredientDraft.quantity || ''}
                  onChange={(event) => setIngredientDraft((draft) => ({ ...draft, quantity: Number(event.target.value) }))}
                  placeholder="e.g. 0.25"
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span>Latest purchase cost</span>
                  <strong className="font-mono-ui text-foreground">
                    {money(inventoryIngredients.find((item) => item.id === ingredientDraft.ingredientId)?.latestUnitCost)} /{' '}
                    {ingredientDraft.unit || 'unit'}
                  </strong>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Available stock</span>
                  <strong className="text-foreground">
                    {inventoryIngredients.find((item) => item.id === ingredientDraft.ingredientId)?.quantityAvailable ?? 0}{' '}
                    {ingredientDraft.unit}
                  </strong>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Recipe quantity must use the ingredient’s base unit.</p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIngredientFormMode(null)}
                  className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground"
                >
                  <Check size={14} />
                  {ingredientFormMode === 'edit' ? 'Update recipe ingredient' : 'Add to recipe'}
                </button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
      <Sheet open={costSettingsOpen} onOpenChange={setCostSettingsOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[75dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-border bg-card p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:max-h-[80dvh] sm:p-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]"
          data-testid="sheet-recipe-cost-settings"
        >
          <SheetHeader className="mb-2 pr-8 text-left sm:mb-3">
            <SheetTitle className="font-display text-lg font-bold sm:text-xl">Additional costs & total</SheetTitle>
            <SheetDescription className="text-[11px] sm:text-xs">
              Set per-serving packaging, labor, and overhead costs, then save the recipe.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 sm:space-y-2.5">
            {(
              [
                ['Packaging', packagingCost, setPackagingCost],
                ['Labor', laborCost, setLaborCost],
                ['Overhead', overheadCost, setOverheadCost],
              ] as const
            ).map(([label, value, setter]) => (
              <label key={label} className="block text-[11px] font-bold text-muted-foreground sm:text-xs">
                {label} per serving
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value === '0' ? '' : value}
                    onChange={(event) => setter(event.target.value)}
                    placeholder="e.g. 12.00"
                    className="h-10 w-full rounded-lg border border-input bg-background pl-7 pr-2 font-mono-ui text-sm text-foreground"
                  />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-border pt-2.5 sm:mt-4 sm:space-y-2 sm:pt-3">
            <div className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span>Ingredient cost</span>
              <strong className="font-mono-ui text-foreground">{money(ingredientCost)}</strong>
            </div>
            <div className="flex justify-between gap-3 text-sm font-bold text-foreground">
              <span>Total cost per serving</span>
              <strong className="font-mono-ui">{money(totalCost)}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={saveCosts}
            disabled={updateCost.isPending || selectedProductId === null}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50 sm:mt-4 sm:h-11"
          >
            <Check size={15} />
            {updateCost.isPending ? 'Saving…' : 'Save recipe costs'}
          </button>
        </SheetContent>
      </Sheet>
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

export function RolesPage() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = currentUser.role === 'owner';
  const rolesQuery = useListRoles({
    query: { queryKey: getListRolesQueryKey(), enabled: isOwner },
  });
  const createRole = useCreateRole();
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false);
  const [notice, setNotice] = useNoticeState();

  const handleCreateRole = (event: React.FormEvent) => {
    event.preventDefault();
    const name = roleName.trim();
    if (name.length < 2 || permissions.length === 0) {
      setNotice({
        message: 'Enter a role name and choose at least one permission.',
        tone: 'error',
      });
      return;
    }
    createRole.mutate(
      { data: { name, permissions } },
      {
        onSuccess: () => {
          setRoleName('');
          setPermissions([]);
          setMobileCreateOpen(false);
          setNotice({ message: `Role "${name}" created.`, tone: 'success' });
          queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
        },
        onError: () =>
          setNotice({
            message: 'Could not create this role. The name may already be in use.',
            tone: 'error',
          }),
      },
    );
  };

  const togglePermission = (permission: RolePermission) => {
    setPermissions((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));
  };

  const roles: Role[] = rolesQuery.data ?? [];
  const renderRoleForm = (mobile = false) => {
    const suffix = mobile ? '-mobile' : '';
    return (
      <>
        <div className="border-b border-border pb-3 md:pb-4">
          <h3 className="font-display text-lg font-bold sm:text-xl md:text-2xl">Create a role</h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs md:mt-1 md:text-sm">Choose a name and page access.</p>
        </div>
        <form onSubmit={handleCreateRole} className="mt-3 space-y-3 md:mt-5 md:space-y-5">
          <div>
            <label
              htmlFor={`new-role-name${suffix}`}
              className="mb-1 block text-[10px] font-bold text-muted-foreground md:mb-1.5 md:text-xs"
            >
              Role name
            </label>
            <input
              id={`new-role-name${suffix}`}
              data-testid={`input-new-role-name${suffix}`}
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              maxLength={40}
              placeholder="e.g. Cook"
              required
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary md:h-11 md:text-sm"
            />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[10px] font-bold text-muted-foreground md:mb-2 md:text-xs">Page permissions</legend>
            <div className="grid gap-1.5 sm:grid-cols-2 md:gap-2">
              {rolePermissionOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-background p-2.5 md:gap-3 md:p-3"
                >
                  <input
                    type="checkbox"
                    data-testid={`checkbox-role-permission-${option.value}${suffix}`}
                    checked={permissions.includes(option.value)}
                    onChange={() => togglePermission(option.value)}
                    disabled={option.value === 'costing'}
                    className="mt-0.5 shrink-0 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold md:text-sm">{option.label}</span>
                    <span className="mt-0.5 block text-[9px] leading-snug text-muted-foreground sm:text-[10px] md:text-xs">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            data-testid={`button-create-role${suffix}`}
            disabled={createRole.isPending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow transition hover:brightness-95 disabled:opacity-50 md:h-11 md:text-sm"
          >
            <ShieldCheck size={16} />
            {createRole.isPending ? 'Creating…' : 'Create role'}
          </button>
        </form>
      </>
    );
  };

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Administration · Access control"
        title="Roles & permissions."
        detail="Create team roles and choose which parts of Ulamify they can access."
      />
      <div className="grid gap-3 md:gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="hidden rounded-2xl border border-card-border bg-card p-5 shadow-sm md:block md:p-7">{renderRoleForm()}</section>

        <section className="rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-card-border md:bg-card md:p-7 md:shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3 md:pb-4">
            <div>
              <h3 className="font-display text-lg font-bold sm:text-xl md:text-2xl">Available roles</h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs md:mt-1 md:text-sm">Roles for team accounts.</p>
            </div>
            <button
              type="button"
              data-testid="button-open-create-role"
              onClick={() => setMobileCreateOpen(true)}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground md:hidden"
            >
              <Plus size={13} />
              Create
            </button>
          </div>
          <div className="mt-3 space-y-2 md:mt-5 md:space-y-3">
            {rolesQuery.isLoading && (
              <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground md:p-4 md:text-sm">Loading roles…</p>
            )}
            {rolesQuery.isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs md:p-4 md:text-sm">
                <p className="font-semibold text-destructive">Could not load roles.</p>
                <button type="button" onClick={() => void rolesQuery.refetch()} className="mt-2 font-bold underline underline-offset-2">
                  Try again
                </button>
              </div>
            )}
            {!rolesQuery.isLoading &&
              !rolesQuery.isError &&
              roles.map((role) => (
                <article key={role.code} className="rounded-xl border border-border bg-background p-3 md:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-bold sm:text-sm">{role.name}</h4>
                    <span className="rounded-full bg-muted px-2 py-1 text-[9px] font-bold uppercase text-muted-foreground">
                      {role.isSystem ? 'Built-in' : 'Custom'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.map((permission) => {
                      const label = rolePermissionOptions.find((option) => option.value === permission)?.label ?? permission;
                      return (
                        <span
                          key={permission}
                          className="rounded-md bg-secondary/15 px-1.5 py-1 text-[8px] font-bold text-secondary sm:px-2 sm:text-[9px]"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>
      <Sheet
        open={mobileCreateOpen}
        onOpenChange={(open) => {
          setMobileCreateOpen(open);
          if (!open) {
            setRoleName('');
            setPermissions([]);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
          data-testid="sheet-create-role"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Create role</SheetTitle>
            <SheetDescription>Enter a role name and choose page permissions.</SheetDescription>
          </SheetHeader>
          {renderRoleForm(true)}
        </SheetContent>
      </Sheet>
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

export function UsersPage() {
  const { currentUser, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManageStaff = currentUser.role === 'owner' || hasPermission('manage-staff');
  const usersQuery = useListUsers({
    query: { queryKey: getListUsersQueryKey(), enabled: canManageStaff },
  });
  const rolesQuery = useListRoles({
    query: { queryKey: getListRolesQueryKey(), enabled: canManageStaff },
  });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('');
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false);
  const [notice, setNotice] = useNoticeState();
  const availableRoles = (rolesQuery.data ?? []).filter((item) => item.code !== 'owner');
  const users = usersQuery.data ?? [];

  useEffect(() => {
    if (!role && availableRoles[0]) setRole(availableRoles[0].code);
  }, [availableRoles, role]);

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !/^\d{4,6}$/.test(pin) || !role) {
      setNotice({
        message: 'Enter a name, choose a role, and use a 4 to 6 digit PIN.',
        tone: 'error',
      });
      return;
    }
    createUser.mutate(
      { data: { name: name.trim(), pin, role } },
      {
        onSuccess: () => {
          setName('');
          setPin('');
          setMobileCreateOpen(false);
          setNotice({
            message: 'Team account created successfully.',
            tone: 'success',
          });
          void queryClient.invalidateQueries({
            queryKey: getListUsersQueryKey(),
          });
        },
        onError: () =>
          setNotice({
            message: 'Could not create the account. Check that the PIN is not already in use.',
            tone: 'error',
          }),
      },
    );
  };

  const toggleUserActive = (id: number, isActive: boolean) => {
    updateUser.mutate(
      { id, data: { isActive: !isActive } },
      {
        onSuccess: () => {
          setNotice({
            message: `Account ${isActive ? 'disabled' : 'activated'}.`,
            tone: 'success',
          });
          void queryClient.invalidateQueries({
            queryKey: getListUsersQueryKey(),
          });
        },
        onError: () =>
          setNotice({
            message: 'Could not update this account.',
            tone: 'error',
          }),
      },
    );
  };

  const renderCreateUserForm = (mobile = false) => {
    const suffix = mobile ? '-mobile' : '';
    return (
      <>
        <div className="flex items-center gap-2 border-b border-border pb-3 md:gap-3 md:pb-4">
          <span className="hidden h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary md:grid">
            <UserPlus size={20} />
          </span>
          <div>
            <h3 className="font-display text-base font-bold sm:text-lg md:text-xl">Add a team member</h3>
            <p className="text-[10px] text-muted-foreground sm:text-xs">Name, role, and 4–6 digit PIN.</p>
          </div>
        </div>
        <form onSubmit={handleCreateUser} className="mt-3 space-y-3 md:mt-5 md:space-y-4">
          <div>
            <label
              htmlFor={`team-user-name${suffix}`}
              className="mb-1 block text-[10px] font-bold text-muted-foreground md:mb-1.5 md:text-xs"
            >
              Full name
            </label>
            <input
              id={`team-user-name${suffix}`}
              data-testid={`input-team-user-name${suffix}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              required
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary md:h-11 md:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor={`team-user-pin${suffix}`}
              className="mb-1 block text-[10px] font-bold text-muted-foreground md:mb-1.5 md:text-xs"
            >
              Login PIN
            </label>
            <input
              id={`team-user-pin${suffix}`}
              data-testid={`input-team-user-pin${suffix}`}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="4 to 6 digits"
              required
              className="h-10 w-full rounded-xl border border-input bg-background px-3 font-mono-ui text-xs outline-none focus:border-primary md:h-11 md:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor={`team-user-role${suffix}`}
              className="mb-1 block text-[10px] font-bold text-muted-foreground md:mb-1.5 md:text-xs"
            >
              Role
            </label>
            <select
              id={`team-user-role${suffix}`}
              data-testid={`select-team-user-role${suffix}`}
              value={role || availableRoles[0]?.code || ''}
              onChange={(event) => setRole(event.target.value)}
              disabled={rolesQuery.isLoading || rolesQuery.isError || availableRoles.length === 0}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary disabled:opacity-50 md:h-11 md:text-sm"
            >
              {availableRoles.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            {rolesQuery.isError && <p className="mt-1 text-xs text-destructive">Could not load roles. Try reloading this page.</p>}
            {!rolesQuery.isLoading && !rolesQuery.isError && availableRoles.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Create a non-admin role on the Roles page before adding team members.</p>
            )}
          </div>
          <button
            type="submit"
            data-testid={`button-create-team-user${suffix}`}
            disabled={createUser.isPending || rolesQuery.isLoading || rolesQuery.isError || availableRoles.length === 0}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow transition hover:brightness-95 disabled:opacity-50 md:h-11 md:text-sm"
          >
            <UserPlus size={16} />
            {createUser.isPending ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </>
    );
  };

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Administration · Team"
        title="Team accounts."
        detail="Add staff and kitchen team members, assign their role, and manage account access."
      />
      <div className="grid gap-3 md:gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <section className="hidden rounded-2xl border border-card-border bg-card p-5 shadow-sm md:block md:p-7">
          {renderCreateUserForm()}
        </section>

        <section className="rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-card-border md:bg-card md:p-7 md:shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3 md:pb-4">
            <div>
              <h3 className="font-display text-lg font-bold sm:text-xl md:text-2xl">Team members</h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs md:mt-1 md:text-sm">Manage staff PIN access.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-bold text-secondary sm:px-3 sm:text-xs">
                {users.filter((user) => user.isActive).length} Active
              </span>
              <button
                type="button"
                data-testid="button-open-create-team-user"
                onClick={() => setMobileCreateOpen(true)}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground md:hidden"
              >
                <Plus size={13} />
                Create
              </button>
            </div>
          </div>
          <div className="mt-3 md:mt-5">
            {usersQuery.isLoading && (
              <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground md:p-4 md:text-sm">Loading team accounts…</p>
            )}
            {usersQuery.isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs md:p-4 md:text-sm">
                <p className="font-semibold text-destructive">Could not load team accounts.</p>
                <button type="button" onClick={() => void usersQuery.refetch()} className="mt-2 font-bold underline underline-offset-2">
                  Try again
                </button>
              </div>
            )}
            {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground md:p-4 md:text-sm">
                No team accounts found.
              </p>
            )}
            {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-left">
                  <thead>
                    <tr className="border-b border-border text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                      <th scope="col" className="py-2 pr-2">
                        Name
                      </th>
                      <th scope="col" className="py-2 px-1">
                        Role
                      </th>
                      <th scope="col" className="py-2 px-1">
                        Status
                      </th>
                      <th scope="col" className="py-2 pl-1 text-right">
                        Access
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} data-testid={`row-team-user-${user.id}`} className="text-[10px] sm:text-xs">
                        <td className="max-w-[110px] truncate py-2.5 pr-2 font-semibold sm:max-w-none">{user.name}</td>
                        <td className="px-1 py-2.5">
                          <span className="block max-w-[75px] truncate rounded bg-muted px-1.5 py-1 text-[8px] font-bold uppercase text-muted-foreground sm:max-w-none sm:inline-block sm:px-2 sm:text-[9px]">
                            {user.roleName}
                          </span>
                        </td>
                        <td className="px-1 py-2.5">
                          <span
                            className={`whitespace-nowrap rounded-full px-1.5 py-1 text-[8px] font-bold sm:px-2 sm:text-[9px] ${user.isActive ? 'bg-[#dcefe9] text-[#176557]' : 'bg-destructive/15 text-destructive'}`}
                          >
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-2 pl-1 text-right">
                          <button
                            type="button"
                            onClick={() => toggleUserActive(user.id, user.isActive)}
                            disabled={updateUser.isPending || user.role === 'owner'}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 sm:p-2"
                            title={
                              user.role === 'owner'
                                ? 'Owner account cannot be disabled here'
                                : user.isActive
                                  ? 'Disable account'
                                  : 'Activate account'
                            }
                            aria-label={`${user.isActive ? 'Disable' : 'Activate'} ${user.name}`}
                          >
                            {user.isActive ? <UserX size={14} /> : <UserPlus size={14} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
      <Sheet
        open={mobileCreateOpen}
        onOpenChange={(open) => {
          setMobileCreateOpen(open);
          if (!open) {
            setName('');
            setPin('');
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
          data-testid="sheet-create-team-user"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Create team account</SheetTitle>
            <SheetDescription>Enter a staff name, PIN, and role.</SheetDescription>
          </SheetHeader>
          {renderCreateUserForm(true)}
        </SheetContent>
      </Sheet>
      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

export function SettingsPage() {
  const { currentUser, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = currentUser.role === 'owner';
  const canConfigurePrices = isOwner || hasPermission('configure-prices');

  const [activeTab, setActiveTab] = useState<'profile' | 'catalog'>('profile');
  const storeProfileQuery = useGetStoreProfile({
    query: { queryKey: getGetStoreProfileQueryKey() },
  });
  const updateStoreProfile = useUpdateStoreProfile();
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');

  const [notice, setNotice] = useNoticeState();

  useEffect(() => {
    if (!storeProfileQuery.data) return;
    setStoreName(storeProfileQuery.data.name);
    setLocation(storeProfileQuery.data.location);
  }, [storeProfileQuery.data]);

  const handleSaveProfile = () => {
    const name = storeName.trim();
    const storeLocation = location.trim();
    if (!name || !storeLocation) {
      setNotice({
        message: 'Enter both a store name and location.',
        tone: 'error',
      });
      return;
    }
    updateStoreProfile.mutate(
      { data: { name, location: storeLocation } },
      {
        onSuccess: (profile) => {
          queryClient.setQueryData(getGetStoreProfileQueryKey(), profile);
          setNotice({ message: 'Store profile saved.', tone: 'success' });
        },
        onError: () =>
          setNotice({
            message: 'Could not save the store profile. Try again.',
            tone: 'error',
          }),
      },
    );
  };

  // Catalog Price Config
  const productsQuery = useListProducts();
  const updateProduct = useUpdateProduct();
  const [editingPrice, setEditingPrice] = useState<Record<number, string>>({});

  const handleSavePrice = (product: Product) => {
    const val = Number(editingPrice[product.id]);
    if (!val || val <= 0) return;
    updateProduct.mutate(
      { id: product.id, data: { price: val } },
      {
        onSuccess: () => {
          setNotice({
            message: `Price updated for ${product.name}.`,
            tone: 'success',
          });
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
        },
      },
    );
  };

  const productsList = (productsQuery.data ?? fallbackProducts).filter((product) => !product.isArchived);

  return (
    <div className="animate-rise">
      <PageHeading
        hideOnMobile
        compact
        eyebrow="Workspace · Store setup"
        title="Make the counter yours."
        detail="Manage your store profile and menu prices."
      />

      <div className="mb-3 flex gap-1.5 overflow-x-auto border-b border-border pb-2 md:mb-6 md:gap-2 md:pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-extrabold transition sm:text-xs md:rounded-xl md:px-4 ${
            activeTab === 'profile'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Store Profile
        </button>
        {(isOwner || hasPermission('manage-staff')) && (
          <Link
            href="/users"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-[10px] font-extrabold text-muted-foreground transition hover:bg-muted sm:text-xs md:gap-1.5 md:rounded-xl md:px-4"
          >
            <ShieldCheck size={12} className="md:h-[14px] md:w-[14px]" />
            Team
          </Link>
        )}
        {canConfigurePrices && (
          <button
            onClick={() => setActiveTab('catalog')}
            className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-extrabold transition sm:text-xs md:rounded-xl md:px-4 ${
              activeTab === 'catalog'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            Price Configuration
          </button>
        )}
      </div>

      {activeTab === 'profile' && (
        <div className="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:p-5 md:p-7">
            <div className="flex items-center gap-2 border-b border-border pb-3 md:items-start md:gap-4 md:border-0 md:pb-0">
              <span className="hidden h-12 w-12 place-items-center rounded-2xl bg-[#e8eaf2] text-[#303952] md:grid">
                <Store size={21} />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold sm:text-xl md:text-2xl">Store profile</h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs md:mt-1 md:text-sm">Shown to your team in the top bar.</p>
              </div>
            </div>
            {storeProfileQuery.isLoading ? (
              <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground md:mt-6 md:p-4 md:text-sm">Loading store profile…</p>
            ) : storeProfileQuery.isError ? (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs md:mt-6 md:p-4 md:text-sm">
                <p className="font-semibold text-destructive">Could not load the store profile.</p>
                <button
                  type="button"
                  onClick={() => void storeProfileQuery.refetch()}
                  className="mt-2 font-bold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:mt-7 md:gap-4">
                  <div>
                    <label htmlFor="store-name" className="mb-1 block text-[10px] font-bold text-muted-foreground md:mb-1.5 md:text-xs">
                      Store name
                    </label>
                    <input
                      id="store-name"
                      data-testid="input-store-name"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary md:h-11 md:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="store-location" className="mb-1 block text-[10px] font-bold text-muted-foreground md:mb-1.5 md:text-xs">
                      Location
                    </label>
                    <input
                      id="store-location"
                      data-testid="input-store-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary md:h-11 md:text-sm"
                    />
                  </div>
                </div>
                <button
                  data-testid="button-save-profile"
                  onClick={handleSaveProfile}
                  disabled={updateStoreProfile.isPending}
                  className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50 md:mt-6 md:px-5 md:py-3 md:text-sm"
                >
                  {updateStoreProfile.isPending ? 'Saving…' : 'Save profile'}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {activeTab === 'catalog' && canConfigurePrices && (
        <section className="rounded-2xl border border-card-border bg-card p-3 shadow-sm sm:p-5 md:p-7">
          <div className="flex items-center justify-between border-b border-border pb-3 md:pb-4">
            <div>
              <h3 className="font-display text-lg font-bold sm:text-xl md:text-2xl">Menu prices</h3>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Prices apply to the counter and receipts.</p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:mt-5 md:grid-cols-3 md:gap-4">
            {productsList.map((product) => (
              <div key={product.id} className="rounded-xl border border-border bg-background p-3 md:p-4">
                <p className="text-xs font-bold md:text-sm">{product.name}</p>
                <p className="text-[10px] text-muted-foreground md:text-xs">{product.category}</p>
                <div className="mt-2 flex items-center gap-2 md:mt-3">
                  <span className="font-mono-ui text-xs font-extrabold text-foreground md:text-sm">₱</span>
                  <input
                    type="number"
                    disabled={!canConfigurePrices}
                    defaultValue={product.price}
                    onChange={(e) =>
                      setEditingPrice((prev) => ({
                        ...prev,
                        [product.id]: e.target.value,
                      }))
                    }
                    className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-card px-2 font-mono-ui text-xs font-bold outline-none focus:border-primary disabled:opacity-60 md:w-24 md:flex-none md:text-sm"
                  />
                  {canConfigurePrices && (
                    <button
                      onClick={() => handleSavePrice(product)}
                      disabled={updateProduct.isPending}
                      className="rounded-lg bg-secondary px-2.5 py-2 text-[10px] font-bold text-secondary-foreground hover:brightness-95 md:px-3 md:text-xs"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {notice && <Notice {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}
