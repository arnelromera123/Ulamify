import Dexie, { type Table } from 'dexie';
import { useCallback, useEffect, useState } from 'react';
import type { OrderInput } from '@workspace/api-client-react';

export type QueueState = 'waiting' | 'syncing' | 'needs_attention';
export type QueuedOrder = OrderInput & {
  localId: string;
  createdAt: string;
  state: QueueState;
  lastAttemptAt?: string;
  lastError?: string;
};

class UlamifyDatabase extends Dexie {
  offlineOrders!: Table<QueuedOrder, string>;

  constructor() {
    super('ulamify');
    this.version(1).stores({
      offlineOrders: 'localId,createdAt',
    });
    this.version(2).stores({
      offlineOrders: 'localId,createdAt,state',
    }).upgrade(async (transaction) => {
      await transaction.table('offlineOrders').toCollection().modify((order: QueuedOrder) => {
        order.state = 'waiting';
      });
    });
  }
}

const database = new UlamifyDatabase();

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedOrder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let mounted = true;
    void database.offlineOrders
      .orderBy('createdAt')
      .toArray()
      .then((stored) => {
        if (mounted) {
          const recovered = stored.map((order) => order.state === 'syncing'
            ? { ...order, state: 'waiting' as const, lastError: 'A previous sync was interrupted; retrying this ticket safely.' }
            : order);
          void database.offlineOrders.bulkPut(recovered).catch(() => {
            if (mounted) setLoadError('The saved ticket state could not be updated on this device.');
          });
          setQueue(recovered);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (mounted) setLoadError('Saved offline tickets could not be loaded from this device.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const add = useCallback(async (order: OrderInput) => {
    const queued: QueuedOrder = {
      ...order,
      localId: `offline-${Date.now()}-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      state: 'waiting',
    };
    await database.offlineOrders.put(queued);
    setQueue((current) => [...current, queued].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    setLoadError(null);
  }, []);

  const update = useCallback(async (localId: string, changes: Partial<QueuedOrder>) => {
    const current = await database.offlineOrders.get(localId);
    if (!current) return;
    const updated = { ...current, ...changes };
    await database.offlineOrders.put(updated);
    setQueue((items) => items.map((item) => item.localId === localId ? updated : item));
  }, []);

  const remove = useCallback(async (localId: string) => {
    await database.offlineOrders.delete(localId);
    setQueue((current) => current.filter((order) => order.localId !== localId));
  }, []);

  const retry = useCallback(async (localId: string) => {
    await update(localId, { state: 'waiting', lastError: undefined });
    setRetryVersion((version) => version + 1);
  }, [update]);

  return { queue, loadError, retryVersion, add, update, remove, retry };
}
