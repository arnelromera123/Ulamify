import Dexie, { type Table } from 'dexie';
import { useCallback, useEffect, useState } from 'react';
import type { OrderInput } from '@workspace/api-client-react';

export type QueuedOrder = OrderInput & { localId: string; createdAt: string };

class UlamifyDatabase extends Dexie {
  offlineOrders!: Table<QueuedOrder, string>;

  constructor() {
    super('ulamify');
    this.version(1).stores({
      offlineOrders: 'localId,createdAt',
    });
  }
}

const database = new UlamifyDatabase();

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedOrder[]>([]);

  useEffect(() => {
    let mounted = true;
    void database.offlineOrders
      .orderBy('createdAt')
      .toArray()
      .then((stored) => {
        if (mounted) setQueue(stored);
      })
      .catch(() => {
        if (mounted) setQueue([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const add = useCallback((order: OrderInput) => {
    const queued = {
      ...order,
      localId: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setQueue((current) => [...current, queued]);
    void database.offlineOrders.put(queued);
  }, []);

  const remove = useCallback((localId: string) => {
    setQueue((current) => current.filter((order) => order.localId !== localId));
    void database.offlineOrders.delete(localId);
  }, []);

  return { queue, add, remove };
}