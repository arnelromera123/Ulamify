# Ulamify POS

Ulamify is an offline-first POS and daily operations suite for Filipino karinderya teams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ulamify` — the responsive cashier, dashboard, kitchen, purchasing, and settings web app
- `artifacts/api-server/src/routes/ulamify.ts` — menu, orders, dashboard, production, and expense routes
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client and Zod schemas
- `lib/db/src/schema/ulamify.ts` — Drizzle schema for products, orders, order items, and operation logs
- `artifacts/ulamify/src/hooks/use-offline-queue.ts` — IndexedDB-backed offline order queue

## Architecture decisions

- The root web artifact owns the cashier experience; the shared API server owns persistence and sync.
- Offline orders are queued in IndexedDB and submitted through the same order endpoint after connectivity returns.
- Product seed data is created lazily on the first catalog read so a fresh database is immediately usable.
- Thermal printing is represented as a readiness hook in settings; the hardware integration can be added without changing checkout.

## Product

The current build provides a fast high-contrast POS counter, Cash/GCash/Maya checkout, online/offline status, IndexedDB offline order sync, recent orders, an owner dashboard, kitchen batch logging, palengke expense logging, product availability toggles, printer readiness, and a PWA manifest/service worker.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
