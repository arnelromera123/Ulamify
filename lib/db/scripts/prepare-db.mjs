import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const directory = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(directory, "../../../.env");
if (!process.env.DATABASE_URL && existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Set it in the environment or root .env file.");
}

const roles = [
  {
    code: "owner",
    name: "Owner / Admin",
    permissions: ["counter", "dashboard", "orders", "kitchen", "purchasing", "settings", "manage-staff", "configure-prices"],
  },
  { code: "cashier", name: "Cashier", permissions: ["counter", "orders"] },
  { code: "kitchen", name: "Kitchen staff", permissions: ["kitchen"] },
  { code: "purchaser", name: "Purchaser", permissions: ["purchasing"] },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.user_roles (
      code text PRIMARY KEY,
      name text NOT NULL,
      permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
      is_system boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    ALTER TABLE public.user_roles
      ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()
  `);

  for (const role of roles) {
    await client.query(
      `INSERT INTO public.user_roles AS existing_role (code, name, permissions, is_system)
       VALUES ($1, $2, $3::jsonb, true)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, permissions = EXCLUDED.permissions, is_system = true
       WHERE existing_role.permissions = '[]'::jsonb`,
      [role.code, role.name, JSON.stringify(role.permissions)],
    );
  }

  const userTable = await client.query(`SELECT to_regclass('public.users') IS NOT NULL AS is_present`);
  if (userTable.rows[0].is_present) {
    await client.query(`
      INSERT INTO public.user_roles AS existing_role (code, name, permissions, is_system)
      SELECT DISTINCT u.role, initcap(replace(u.role, '-', ' ')), '["counter"]'::jsonb, false
      FROM public.users u
      WHERE u.role IS NOT NULL
      ON CONFLICT (code) DO UPDATE
      SET permissions = EXCLUDED.permissions
      WHERE existing_role.permissions = '[]'::jsonb
    `);
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.ulamify_data_migrations (
      migration_key text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.store_profile (
      id integer PRIMARY KEY DEFAULT 1,
      name text NOT NULL DEFAULT 'Bayanihan Kitchen',
      location text NOT NULL DEFAULT 'Makati'
    )
  `);
  await client.query(`
    INSERT INTO public.store_profile (id, name, location)
    VALUES (1, 'Bayanihan Kitchen', 'Makati')
    ON CONFLICT (id) DO NOTHING
  `);
  const voidRequestsTable = await client.query(`SELECT to_regclass('public.void_requests') IS NOT NULL AS is_present`);
  if (voidRequestsTable.rows[0].is_present) {
    await client.query(`
      ALTER TABLE public.void_requests
        ADD COLUMN IF NOT EXISTS stock_restocked boolean NOT NULL DEFAULT false
    `);
  }

  const productsTable = await client.query(`SELECT to_regclass('public.products') IS NOT NULL AS is_present`);
  if (productsTable.rows[0].is_present) {
    await client.query(`
      ALTER TABLE public.products
        ADD COLUMN IF NOT EXISTS stock_count integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false
    `);

    const backfill = await client.query(
      `SELECT 1 FROM public.ulamify_data_migrations WHERE migration_key = 'stock-from-batches-and-sales-v1'`,
    );
    if (backfill.rowCount === 0) {
      const hasLogs = await client.query(`SELECT to_regclass('public.operation_logs') IS NOT NULL AS is_present`);
      const hasOrders = await client.query(`
        SELECT to_regclass('public.orders') IS NOT NULL
          AND to_regclass('public.order_items') IS NOT NULL AS is_present
      `);
      if (hasLogs.rows[0].is_present || hasOrders.rows[0].is_present) {
        const produced = hasLogs.rows[0].is_present
          ? `COALESCE((SELECT SUM(l.servings) FROM public.operation_logs l
              WHERE l.product_id = p.id AND l.type = 'batch_production'), 0)`
          : "0";
        const sold = hasOrders.rows[0].is_present
          ? `COALESCE((SELECT SUM(i.quantity) FROM public.order_items i
              JOIN public.orders o ON o.id = i.order_id
              WHERE i.product_id = p.id AND o.status IN ('completed', 'voided')), 0)`
          : "0";
        const returned = hasOrders.rows[0].is_present && voidRequestsTable.rows[0].is_present
          ? `COALESCE((SELECT SUM(i.quantity) FROM public.order_items i
              JOIN public.void_requests v ON v.order_id = i.order_id
              WHERE i.product_id = p.id AND v.status = 'approved' AND v.stock_restocked = true), 0)`
          : "0";
        await client.query(`
          UPDATE public.products p
          SET stock_count = GREATEST(0, ${produced} - ${sold} + ${returned})
        `);
      }
    }
  }
  await client.query(
    `INSERT INTO public.ulamify_data_migrations (migration_key)
     VALUES ('stock-from-batches-and-sales-v1')
     ON CONFLICT (migration_key) DO NOTHING`,
  );

  const ordersTable = await client.query(`SELECT to_regclass('public.orders') IS NOT NULL AS is_present`);
  if (ordersTable.rows[0].is_present) {
    await client.query(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS offline_id text`);
    const duplicateOfflineIds = await client.query(`
      SELECT offline_id FROM public.orders
      WHERE offline_id IS NOT NULL
      GROUP BY offline_id
      HAVING COUNT(*) > 1
      LIMIT 1
    `);
    if (duplicateOfflineIds.rowCount) {
      throw new Error(
        `Duplicate offline_id "${duplicateOfflineIds.rows[0].offline_id}" exists in orders. Resolve duplicates before adding the idempotency constraint.`,
      );
    }
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS orders_offline_id_unique
      ON public.orders (offline_id)
    `);
  }

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
