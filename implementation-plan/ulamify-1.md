# Ulamify POS implementation plan for a carinderia

## Target operating setup

This plan assumes one small Filipino eatery with counter ordering, ulam cooked in batches, rice and other ready-to-sell items, daily or frequent Palengke purchases, a small staff, and mostly cash with some GCash/Maya. It prioritizes fast service and a trustworthy daily money/stock picture. It does not assume table-service routing, a procurement department, or multiple branches.

The current system already has a good foundation for this setup: counter sales, batch-production logs, prepared-serving stock, ingredient recipes and FIFO lots, Palengke trips, and PIN-based roles. Preserve that simple operating model.

## Implementation status

- **Implemented in the current work:** Phase 1 dashboard data correctness; Phase 2 persisted, ordered offline queue recovery; Phase 3 receipt printing, order attribution, and one immutable daily cash close per business date; Phase 4 ingredient and prepared-serving counts/waste with movement history; core Phase 5 Palengke validation and dated non-inventory expense entry.
- **Still planned:** Configurable low-stock thresholds, a date-filtered daily/weekly sales-purchase-expense and estimated-margin report, and Phase 6 operator-dependent features.
- Database migrations have been generated for the new order attribution and daily-close records. They still need to be applied to the target database before those features can run there.

## Recommended sequence

| Phase | Outcome | Priority |
| --- | --- | --- |
| 1. Trustworthy daily numbers | Dashboard reflects actual sales, expenses, and menu performance | Do first |
| 2. Reliable counter, including weak internet | Cashiers can tell whether every ticket is saved or needs attention | Do first |
| 3. Simple daily close and receipt lookup | Owner/cashier can reconcile cash and verify transactions | High |
| 4. Practical stock and waste control | Purchases, production, spoilage, and counts tell a coherent story | High |
| 5. Streamline Palengke and expenses | Record the real daily buying flow without formal purchasing overhead | High |
| 6. Optional service improvements | Add only features requested by the actual shop | Later |

## Phase 1: Make the daily dashboard accurate

### Work

- Replace the static dashboard date, fixed top-product label, and constant pending-order count with real values.
- Calculate totals on the server for the shop's local business day, using an explicit Asia/Manila timezone setting (or a store setting if more locations are added later).
- Show a small set of useful numbers: sales today, order count, average order, top-selling items, recorded expenses, low prepared servings, and ingredient alerts.
- Separate sales from expenses and avoid labeling purchase spend as food cost. Keep the first version understandable to an owner checking the shop between service periods.
- Show loading, no-data, and error states distinctly; a failed request must not look like a zero-sales day.

### Acceptance criteria

- Dashboard totals match order and expense records for a selected date in Philippine local time.
- Top items are ranked from actual order items; no fixed product name is shown.
- The dashboard never reports a fake zero or fixed pending-order count when data is missing.

## Phase 2: Make counter sales dependable with weak internet

### Work

- Keep the existing local offline order queue and stable `offlineId` idempotency key.
- Show each queued ticket's items, total, time created, and state (waiting, syncing, synced, or needs attention).
- Sync queued tickets one at a time in creation order. Retry temporary network failures with bounded backoff.
- Stop automatic retries for stock conflicts or invalid tickets and explain the next step to the cashier.
- Provide explicit retry and discard actions; ask for confirmation before discarding a sale.
- Make the cashier wait for the save result before the UI implies the payment/order is complete. For offline sales, clearly say that the sale is stored on this device and still needs syncing.

### Acceptance criteria

- A ticket survives refresh/reopening the app and is sent to the server at most once.
- A cashier can distinguish a saved online order from an offline ticket awaiting sync.
- A failed ticket remains visible with a useful explanation and can be retried after the issue is addressed.
- Earlier tickets are handled before later tickets so stock conflicts do not silently reorder the day's sales.

## Phase 3: Lightweight daily close and transaction lookup

### Work

- Add order detail/receipt lookup with a simple print-friendly receipt. Include order number, Philippine-local date/time, items, total, payment type, cash tendered, change, and store name.
- Add a lightweight day-close screen: expected cash from cash orders, counted cash, variance, and a short note for a mismatch.
- Show GCash and Maya totals separately for manual comparison with the wallet apps; do not imply automated payment confirmation when none exists.
- Allow an owner/manager to review the day's order, expense, and close summary later.
- Keep shift setup minimal for the initial single-counter setup. Add separate registers or overlapping shifts only if the shop's actual routine needs them.

### Acceptance criteria

- A past transaction can be found and printed without changing or duplicating it.
- Day close uses saved order records and clearly separates cash from e-wallet totals.
- The counted-cash variance and note are saved with who closed the day and when.
- A reopened/closed day cannot be silently rewritten; corrections are recorded as adjustments.

## Phase 4: Keep stock tracking useful and easy to maintain

### Implemented

- Ingredient opening/physical counts, spoilage, staff meals, and corrections update FIFO lots and append reason-coded movement records.
- Prepared-serving counts, leftovers, spoilage, and staff meals update menu stock transactionally and are recorded with the responsible user.
- Ingredient and prepared-serving history is available from Inventory; batch production appears in prepared-serving history.
- Negative stock corrections are rejected when they exceed available stock.

### Work

- Preserve the current batch-production model: logging a cooked batch consumes recipe ingredients and adds prepared servings; selling a serving reduces prepared stock.
- Add a quick prepared-food count/adjustment for opening stock, end-of-day leftovers, and spoilage. Record a simple reason such as opening count, spoiled, staff meal, or correction.
- Add an ingredient stock count flow that compares expected stock with a counted quantity and records the difference as an audited movement.
- Add a basic stock movement history so an owner can answer “why did this count change?”
- Warn on low prepared servings and low ingredient quantities using configurable thresholds where practical.
- Defer expiry dates and first-expiring-first-out logic unless the shop confirms that expiry tracking is a real recurring need; it adds entry work and should not slow daily receiving.

### Acceptance criteria

- A batch, sale, waste record, count, or purchase updates the appropriate inventory balance and creates a traceable movement.
- Negative corrections cannot consume more stock than exists without an explicit owner override.
- Staff can record leftovers/spoilage quickly with a reason and quantity.
- The owner can review ingredient and prepared-item movements by date.

## Phase 5: Fit purchasing and expenses to Palengke routines

### Implemented

- Non-inventory expense entry supports supplies, transport/delivery, other costs, a Philippine business date, and an optional note; it does not create ingredient stock.
- Palengke item links are limited to inventory-relevant items and the server validates linked units before saving a trip.
- Existing fare allocation and linked trip item stock receipts remain part of the single Palengke trip flow.

### Work

- Keep the existing Palengke trip form as the primary purchase flow; support quick item entry, quantities, unit, item cost, total fare/delivery, and an optional seller/market note.
- Ensure the trip total and fare allocation reconcile, and make it clear which items were imported into ingredient stock to avoid importing the same trip item twice.
- Keep saved supplier names optional and lightweight. Do not require a supplier directory or formal purchase-order lifecycle for a shop buying from several market stalls.
- Restore or add a quick non-inventory expense entry for gas, packaging, cleaning supplies, and similar costs, with amount, category, date, and optional note.
- Distinguish purchase cash outflow from ingredient cost consumed in recipes; provide a simple daily/weekly view of sales, purchases, other expenses, and estimated gross margin.

### Acceptance criteria

- A typical Palengke trip can be recorded quickly without creating a purchase order first.
- Each trip item can be linked/imported once, and landed cost includes its allocated fare.
- Non-inventory expenses can be recorded without creating fake ingredient stock.
- Reports explain purchases versus consumed ingredient cost in plain language.

## Phase 6: Only add service features the shop needs

Decide these with the owner/staff before implementation:

- **Kitchen tickets:** The current Kitchen page is for batch production, not a customer-order queue. Add order tickets only if cooks need a screen to receive and mark made-to-order tickets. Keep it separate from batch logging.
- **Dine-in tables:** Add table numbers/open tabs only if the shop regularly serves customers at tables and needs to keep bills open. For counter/takeout service, defer it.
- **Discounts and tax/receipt configuration:** Define the real pricing and receipt requirements before changing checkout totals.
- **Online/QR ordering and payment integration:** Add only when the shop has a stable process to accept, fulfill, and reconcile digital orders.
- **Multiple branches, loyalty, and formal purchase orders:** Defer until there is a demonstrated need.

## Technical delivery rules

- Update the OpenAPI contract with API changes and regenerate the React client and Zod schemas in the same phase.
- Use Drizzle migrations for persisted changes.
- Keep inventory operations transactional and append movement records rather than silently overwriting balances.
- Enforce permissions on the API as well as in the interface.
- Add focused automated checks for daily totals/timezone, queue idempotency and ordering, stock calculations, and closeout arithmetic as these flows are implemented.

## Suggested first release

Implement Phases 1–3 first, then pilot stock count/spoilage in Phase 4. This fixes the most visible trust gaps while preserving the carinderia's fast counter and batch-cooking routine. Avoid building formal purchasing, table-service, or multi-branch features until operators ask for them.
