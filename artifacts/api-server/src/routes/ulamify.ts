import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateExpenseLogBody,
  CreateExpenseLogResponse,
  CreateOrderBody,
  CreateOrderResponse,
  CreateProductionLogBody,
  CreateProductionLogResponse,
  GetDashboardSummaryResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  ListProductsResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import {
  db,
  operationLogsTable,
  orderItemsTable,
  ordersTable,
  productsTable,
} from "@workspace/db";

const router: IRouter = Router();

const seedProducts = [
  { name: "Adobo sa Gata", category: "Ulam", price: "85", accent: "terracotta" },
  { name: "Crispy Liempo", category: "Ulam", price: "95", accent: "orange" },
  { name: "Sinigang na Baboy", category: "Ulam", price: "90", accent: "rose" },
  { name: "Ginisang Ampalaya", category: "Ulam", price: "65", accent: "green" },
  { name: "Plain Rice", category: "Rice", price: "25", accent: "cream" },
  { name: "Extra Rice", category: "Add-on", price: "20", accent: "cream" },
  { name: "Bottled Water", category: "Beverage", price: "20", accent: "blue" },
  { name: "Calamansi Juice", category: "Beverage", price: "35", accent: "yellow" },
];

function money(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function productResponse(product: typeof productsTable.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    category: product.category as "Ulam" | "Rice" | "Beverage" | "Add-on",
    price: money(product.price),
    isAvailable: product.isAvailable,
    accent: product.accent,
  };
}

async function ensureSeedProducts() {
  const existing = await db.select().from(productsTable).limit(1);
  if (existing.length > 0) return;
  await db.insert(productsTable).values(seedProducts);
}

async function orderResponse(order: typeof ordersTable.$inferSelect) {
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));
  return {
    id: String(order.id),
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
    })),
    totalAmount: money(order.totalAmount),
    paymentMethod: order.paymentMethod as "Cash" | "GCash" | "Maya",
    cashTendered:
      order.cashTendered === null ? null : money(order.cashTendered),
    change: order.changeAmount === null ? null : money(order.changeAmount),
    status: order.status as "completed" | "voided",
    createdAt: order.createdAt.toISOString(),
    synced: true,
  };
}

router.get("/products", async (_req, res): Promise<void> => {
  await ensureSeedProducts();
  const products = await db.select().from(productsTable).orderBy(productsTable.id);
  res.json(ListProductsResponse.parse(products.map(productResponse)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const body = UpdateProductBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid product update" });
    return;
  }
  const [updated] = await db
    .update(productsTable)
    .set({
      ...(body.data.price === undefined ? {} : { price: String(body.data.price) }),
      ...(body.data.isAvailable === undefined
        ? {}
        : { isAvailable: body.data.isAvailable }),
    })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(UpdateProductResponse.parse(productResponse(updated)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const productIds = parsed.data.items.map((item) => item.productId);
  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, productIds));
  if (products.length !== new Set(productIds).size) {
    res.status(400).json({ error: "One or more products were not found" });
    return;
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  const items = parsed.data.items.map((item) => {
    const product = byId.get(item.productId)!;
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: money(product.price),
    };
  });
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const cashTendered = parsed.data.cashTendered ?? null;
  const change =
    parsed.data.paymentMethod === "Cash" && cashTendered !== null
      ? Math.max(0, cashTendered - totalAmount)
      : null;
  const result = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(ordersTable)
      .values({
        totalAmount: totalAmount.toFixed(2),
        paymentMethod: parsed.data.paymentMethod,
        cashTendered: cashTendered === null ? null : cashTendered.toFixed(2),
        changeAmount: change === null ? null : change.toFixed(2),
        offlineId: parsed.data.offlineId ?? null,
      })
      .returning();
    await tx.insert(orderItemsTable).values(
      items.map((item) => ({
        orderId: created.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      })),
    );
    return created;
  });
  res.status(201).json(CreateOrderResponse.parse(await orderResponse(result)));
});

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(parsed.data.limit);
  const response = await Promise.all(orders.map(orderResponse));
  res.json(ListOrdersResponse.parse(response));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const orders = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        gte(ordersTable.createdAt, startOfDay),
        eq(ordersTable.status, "completed"),
      ),
    );
  const logs = await db.select().from(operationLogsTable).where(
    gte(operationLogsTable.createdAt, startOfDay),
  );
  const todaySales = orders.reduce((sum, order) => sum + money(order.totalAmount), 0);
  const expenseTotal = logs
    .filter((log) => log.type === "palengke_expense")
    .reduce((sum, log) => sum + money(log.amount), 0);
  const response = {
    todaySales,
    orderCount: orders.length,
    averageOrder: orders.length === 0 ? 0 : todaySales / orders.length,
    pendingOrders: 0,
    lowStockCount: 2,
    expenseTotal,
    topProduct: "Adobo sa Gata",
  };
  res.json(GetDashboardSummaryResponse.parse(response));
});

router.post("/operations/production", async (req, res): Promise<void> => {
  const parsed = CreateProductionLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [created] = await db
    .insert(operationLogsTable)
    .values({
      type: "batch_production",
      details: `${product.name}: ${parsed.data.servings} servings${parsed.data.note ? ` · ${parsed.data.note}` : ""}`,
      amount: "0",
      servings: parsed.data.servings,
      productId: product.id,
    })
    .returning();
  res.status(201).json(
    CreateProductionLogResponse.parse({
      id: String(created.id),
      type: created.type,
      details: created.details,
      amount: money(created.amount),
      createdAt: created.createdAt.toISOString(),
    }),
  );
});

router.post("/operations/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(operationLogsTable)
    .values({
      type: "palengke_expense",
      details: `${parsed.data.details}${parsed.data.category ? ` · ${parsed.data.category}` : ""}`,
      amount: parsed.data.amount.toFixed(2),
    })
    .returning();
  res.status(201).json(
    CreateExpenseLogResponse.parse({
      id: String(created.id),
      type: created.type,
      details: created.details,
      amount: money(created.amount),
      createdAt: created.createdAt.toISOString(),
    }),
  );
});

export default router;