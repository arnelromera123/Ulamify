---
name: Ulamify offline queue
description: Durable rule for preserving POS sales when connectivity drops.
---

Ulamify must keep offline orders in IndexedDB and replay them through the normal order creation contract once connectivity returns.

**Why:** A cashier cannot pause service because the connection is unreliable, and the server must still receive the same validated order shape for consistent accounting.

**How to apply:** Keep the queue local to the device, show its pending count in the counter shell, and only remove a ticket after the server confirms it.