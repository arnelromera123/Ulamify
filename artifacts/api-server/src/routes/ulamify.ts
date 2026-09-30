import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ApproveVoidRequestBody,
  ApproveVoidRequestParams,
  ApproveVoidRequestResponse,
  CreateExpenseLogBody,
  CreateExpenseLogResponse,
  CreateOrderBody,
  CreateOrderResponse,
  CreateProductBody,
  CreateProductResponse,
  GetStoreProfileResponse,
  CreateRoleBody,
  CreateRoleResponse,
  CreateProductionLogBody,
  CreateProductionLogResponse,
  CreateUserBody,
  CreateUserResponse,
  CreateVoidRequestBody,
  CreateVoidRequestParams,
  CreateVoidRequestResponse,
  GetDashboardSummaryResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  ListProductsResponse,
  ListRolesResponse,
  ListUsersResponse,
  ListVoidRequestsResponse,
  LoginBody,
  LoginResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
  ArchiveProductParams,
  ArchiveProductResponse,
  UpdateUserBody,
  UpdateUserParams,
  UpdateUserResponse,
  UpdateStoreProfileBody,
  UpdateStoreProfileResponse,
} from "@workspace/api-zod";
import type { RolePermission } from "@workspace/api-zod";
import {
  db,
  operationLogsTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  storeProfileTable,
  usersTable,
  userRolesTable,
  voidRequestsTable,
} from "@workspace/db";

const router: IRouter = Router();
const defaultStoreProfile = { id: 1, name: "Bayanihan Kitchen", location: "Makati" };

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

const seedOwnerUser = {
  name: "Owner Admin",
  pin: "1234",
  role: "owner" as const,
  isActive: true,
};

const seedRoles = [
  {
    code: "owner",
    name: "Owner / Admin",
    permissions: [
      "counter",
      "dashboard",
      "orders",
      "kitchen",
      "purchasing",
      "settings",
      "manage-staff",
      "configure-prices",
    ],
    isSystem: true,
  },
  {
    code: "cashier",
    name: "Cashier",
    permissions: ["counter", "orders"],
    isSystem: true,
  },
  {
    code: "kitchen",
    name: "Kitchen staff",
    permissions: ["kitchen"],
    isSystem: true,
  },
  {
    code: "purchaser",
    name: "Purchaser",
    permissions: ["purchasing"],
    isSystem: true,
  },
] satisfies (typeof userRolesTable.$inferInsert)[];

function money(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

class StockShortageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function productResponse(product: typeof productsTable.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    category: product.category as "Ulam" | "Rice" | "Beverage" | "Add-on",
    price: money(product.price),
    isAvailable: product.isAvailable,
    stockCount: product.stockCount,
    isArchived: product.isArchived,
    accent: product.accent,
  };
}

function roleResponse(role: typeof userRolesTable.$inferSelect) {
  return {
    code: role.code,
    name: role.name,
    permissions: role.permissions as RolePermission[],
    isSystem: role.isSystem,
  };
}

function userResponse(
  user: typeof usersTable.$inferSelect,
  role: typeof userRolesTable.$inferSelect,
) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    roleName: role.name,
    permissions: role.permissions as RolePermission[],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

async function ensureSeedRoles() {
  await db.insert(userRolesTable).values(seedRoles).onConflictDoNothing();
}

async function ensureSeedProducts() {
  const existing = await db.select().from(productsTable).limit(1);
  if (existing.length > 0) return;
  await db.insert(productsTable).values(seedProducts);
}

async function ensureSeedUser() {
  await ensureSeedRoles();
  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) return;
  await db.insert(usersTable).values(seedOwnerUser);
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

// ---------------------------------------------------------------------------
// Auth & User Management Routes
// ---------------------------------------------------------------------------

router.post("/auth/login", async (req, res): Promise<void> => {
  await ensureSeedUser();
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid PIN format" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.pin, parsed.data.pin), eq(usersTable.isActive, true)));
  if (!user) {
    res.status(401).json({ error: "Incorrect or inactive PIN" });
    return;
  }
  const [role] = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.code, user.role));
  if (!role) {
    res.status(500).json({ error: "User role is not configured" });
    return;
  }
  res.json(LoginResponse.parse({ user: userResponse(user, role) }));
});

router.get("/users", async (_req, res): Promise<void> => {
  await ensureSeedUser();
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  const roles = await db.select().from(userRolesTable);
  const rolesByCode = new Map(roles.map((role) => [role.code, role]));
  const responses = users.map((user) => {
    const role = rolesByCode.get(user.role);
    if (!role) throw new Error(`Role "${user.role}" is not configured`);
    return userResponse(user, role);
  });
  res.json(ListUsersResponse.parse(responses));
});

router.post("/users", async (req, res): Promise<void> => {
  await ensureSeedRoles();
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [role] = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.code, parsed.data.role));
  if (!role) {
    res.status(400).json({ error: "Selected role does not exist" });
    return;
  }
  const [created] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      pin: parsed.data.pin,
      role: parsed.data.role,
    })
    .returning();
  res.status(201).json(CreateUserResponse.parse(userResponse(created, role)));
});

router.get("/roles", async (_req, res): Promise<void> => {
  await ensureSeedRoles();
  const roles = await db.select().from(userRolesTable).orderBy(userRolesTable.name);
  res.json(ListRolesResponse.parse(roles.map(roleResponse)));
});

router.post("/roles", async (req, res): Promise<void> => {
  await ensureSeedRoles();
  const parsed = CreateRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name.trim();
  if (name.length < 2) {
    res.status(400).json({ error: "Role name must be at least 2 characters" });
    return;
  }
  const code =
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "role";
  const [created] = await db
    .insert(userRolesTable)
    .values({
      code,
      name,
      permissions: parsed.data.permissions,
      isSystem: false,
    })
    .onConflictDoNothing()
    .returning();
  if (!created) {
    res.status(409).json({ error: "A role with that name already exists" });
    return;
  }
  res.status(201).json(CreateRoleResponse.parse(roleResponse(created)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  await ensureSeedRoles();
  const params = UpdateUserParams.safeParse(req.params);
  const body = UpdateUserBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid user update request" });
    return;
  }
  if (body.data.role !== undefined) {
    const [role] = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.code, body.data.role));
    if (!role) {
      res.status(400).json({ error: "Selected role does not exist" });
      return;
    }
  }
  const [updated] = await db
    .update(usersTable)
    .set({
      ...(body.data.name === undefined ? {} : { name: body.data.name }),
      ...(body.data.pin === undefined ? {} : { pin: body.data.pin }),
      ...(body.data.role === undefined ? {} : { role: body.data.role }),
      ...(body.data.isActive === undefined ? {} : { isActive: body.data.isActive }),
    })
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [role] = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.code, updated.role));
  if (!role) {
    res.status(500).json({ error: "User role is not configured" });
    return;
  }
  res.json(UpdateUserResponse.parse(userResponse(updated, role)));
});

// ---------------------------------------------------------------------------
// Product Catalog Routes
// ---------------------------------------------------------------------------

router.get("/products", async (_req, res): Promise<void> => {
  await ensureSeedProducts();
  const products = await db.select().from(productsTable).orderBy(productsTable.id);
  res.json(ListProductsResponse.parse(products.map(productResponse)));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name.trim();
  if (name.length < 2) {
    res.status(400).json({ error: "Product name must be at least 2 characters" });
    return;
  }
  const [created] = await db
    .insert(productsTable)
    .values({
      name,
      category: parsed.data.category,
      price: String(parsed.data.price),
      isAvailable: parsed.data.isAvailable ?? true,
      ...(parsed.data.accent === undefined ? {} : { accent: parsed.data.accent }),
    })
    .returning();
  res.status(201).json(CreateProductResponse.parse(productResponse(created)));
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
      ...(body.data.name === undefined ? {} : { name: body.data.name.trim() }),
      ...(body.data.category === undefined ? {} : { category: body.data.category }),
      ...(body.data.price === undefined ? {} : { price: String(body.data.price) }),
      ...(body.data.isAvailable === undefined
        ? {}
        : { isAvailable: body.data.isAvailable }),
      ...(body.data.isArchived === undefined
        ? {}
        : {
            isArchived: body.data.isArchived,
            ...(body.data.isArchived ? { isAvailable: false } : {}),
          }),
    })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(UpdateProductResponse.parse(productResponse(updated)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = ArchiveProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }
  const [archived] = await db
    .update(productsTable)
    .set({ isArchived: true, isAvailable: false })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!archived) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(ArchiveProductResponse.parse(productResponse(archived)));
});

// ---------------------------------------------------------------------------
// Orders & Void Requests Routes
// ---------------------------------------------------------------------------

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
  const quantitiesByProduct = new Map<number, number>();
  for (const item of parsed.data.items) {
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }
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
  let result: { order: typeof ordersTable.$inferSelect; duplicate: boolean };
  try {
    result = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(ordersTable)
      .values({
        totalAmount: totalAmount.toFixed(2),
        paymentMethod: parsed.data.paymentMethod,
        cashTendered: cashTendered === null ? null : cashTendered.toFixed(2),
        changeAmount: change === null ? null : change.toFixed(2),
        offlineId: parsed.data.offlineId ?? null,
      })
      .onConflictDoNothing({ target: ordersTable.offlineId })
      .returning();
    if (!created) {
      if (parsed.data.offlineId) {
        const [existing] = await tx
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.offlineId, parsed.data.offlineId));
        if (existing) return { order: existing, duplicate: true };
      }
      throw new Error("Order could not be created");
    }

    for (const [productId, quantity] of [...quantitiesByProduct].sort(([a], [b]) => a - b)) {
      const [updatedProduct] = await tx
        .update(productsTable)
        .set({ stockCount: sql`${productsTable.stockCount} - ${quantity}` })
        .where(
          and(
            eq(productsTable.id, productId),
            eq(productsTable.isAvailable, true),
            eq(productsTable.isArchived, false),
            gte(productsTable.stockCount, quantity),
          ),
        )
        .returning({ id: productsTable.id });
      if (!updatedProduct) {
        const product = byId.get(productId)!;
        const [currentProduct] = await tx
          .select({
            stockCount: productsTable.stockCount,
            isAvailable: productsTable.isAvailable,
          })
          .from(productsTable)
          .where(eq(productsTable.id, productId));
        throw new StockShortageError(
          !currentProduct?.isAvailable
            ? `${product.name} is currently paused and cannot be sold.`
            : `Not enough stock for ${product.name}. ${currentProduct?.stockCount ?? 0} remaining.`,
        );
      }
    }

    await tx.insert(orderItemsTable).values(
      items.map((item) => ({
        orderId: created.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      })),
    );
    return { order: created, duplicate: false };
    });
  } catch (error) {
    if (error instanceof StockShortageError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
  res
    .status(result.duplicate ? 200 : 201)
    .json(CreateOrderResponse.parse(await orderResponse(result.order)));
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

router.post("/orders/:id/void-request", async (req, res): Promise<void> => {
  const params = CreateVoidRequestParams.safeParse(req.params);
  const body = CreateVoidRequestBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid void request" });
    return;
  }
  const orderId = Number(params.data.id);
  const [created] = await db
    .insert(voidRequestsTable)
    .values({
      orderId,
      requestedByUserId: body.data.requestedByUserId ?? null,
      reason: body.data.reason,
      status: "pending",
      stockRestocked: false,
    })
    .returning();

  let requestedByName: string | null = null;
  if (created.requestedByUserId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, created.requestedByUserId));
    if (u) requestedByName = u.name;
  }

  res.status(201).json(
    CreateVoidRequestResponse.parse({
      id: created.id,
      orderId: created.orderId,
      reason: created.reason,
      status: created.status as "pending" | "approved" | "rejected",
      requestedByName,
      stockRestocked: created.stockRestocked,
      createdAt: created.createdAt.toISOString(),
    }),
  );
});

router.get("/void-requests", async (_req, res): Promise<void> => {
  const requests = await db
    .select()
    .from(voidRequestsTable)
    .where(eq(voidRequestsTable.status, "pending"))
    .orderBy(desc(voidRequestsTable.createdAt));

  const response = await Promise.all(
    requests.map(async (vr) => {
      let requestedByName: string | null = null;
      if (vr.requestedByUserId) {
        const [u] = await db.select().from(usersTable).where(eq(usersTable.id, vr.requestedByUserId));
        if (u) requestedByName = u.name;
      }
      return {
        id: vr.id,
        orderId: vr.orderId,
        reason: vr.reason,
        status: vr.status as "pending" | "approved" | "rejected",
        requestedByName,
        stockRestocked: vr.stockRestocked,
        createdAt: vr.createdAt.toISOString(),
      };
    }),
  );

  res.json(ListVoidRequestsResponse.parse(response));
});

router.post("/void-requests/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveVoidRequestParams.safeParse(req.params);
  const body = ApproveVoidRequestBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid approval request" });
    return;
  }
  const newStatus = body.data.approved ? "approved" : "rejected";
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(voidRequestsTable)
      .set({
        status: newStatus,
        approvedByUserId: body.data.approvedByUserId ?? null,
        stockRestocked: body.data.approved && body.data.restockReusableItems,
      })
      .where(
        and(
          eq(voidRequestsTable.id, params.data.id),
          eq(voidRequestsTable.status, "pending"),
        ),
      )
      .returning();
    if (!updated) return null;

    if (body.data.approved) {
      const [order] = await tx
        .update(ordersTable)
        .set({ status: "voided" })
        .where(
          and(
            eq(ordersTable.id, updated.orderId),
            eq(ordersTable.status, "completed"),
          ),
        )
        .returning({ id: ordersTable.id });
      if (!order) throw new Error(`Order ${updated.orderId} is not in a voidable state`);

      if (body.data.restockReusableItems) {
        const orderItems = await tx
          .select({
            productId: orderItemsTable.productId,
            quantity: orderItemsTable.quantity,
          })
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, updated.orderId));
        for (const item of orderItems) {
          await tx
            .update(productsTable)
            .set({ stockCount: sql`${productsTable.stockCount} + ${item.quantity}` })
            .where(eq(productsTable.id, item.productId));
        }
      }
    }
    return updated;
  });
  if (!result) {
    res.status(409).json({ error: "Void request has already been processed" });
    return;
  }
  const updated = result;

  let requestedByName: string | null = null;
  if (updated.requestedByUserId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, updated.requestedByUserId));
    if (u) requestedByName = u.name;
  }

  res.json(
    ApproveVoidRequestResponse.parse({
      id: updated.id,
      orderId: updated.orderId,
      reason: updated.reason,
      status: updated.status as "pending" | "approved" | "rejected",
      requestedByName,
      stockRestocked: updated.stockRestocked,
      createdAt: updated.createdAt.toISOString(),
    }),
  );
});

router.get("/store-profile", async (_req, res): Promise<void> => {
  await db
    .insert(storeProfileTable)
    .values(defaultStoreProfile)
    .onConflictDoNothing();
  const [profile] = await db
    .select()
    .from(storeProfileTable)
    .where(eq(storeProfileTable.id, defaultStoreProfile.id));
  res.json(GetStoreProfileResponse.parse(profile));
});

router.put("/store-profile", async (req, res): Promise<void> => {
  const body = UpdateStoreProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const name = body.data.name.trim();
  const location = body.data.location.trim();
  if (!name || !location) {
    res.status(400).json({ error: "Store name and location are required" });
    return;
  }
  const [profile] = await db
    .insert(storeProfileTable)
    .values({ id: defaultStoreProfile.id, name, location })
    .onConflictDoUpdate({
      target: storeProfileTable.id,
      set: { name, location },
    })
    .returning();
  res.json(UpdateStoreProfileResponse.parse(profile));
});

// ---------------------------------------------------------------------------
// Dashboard & Operations Routes
// ---------------------------------------------------------------------------

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
  const products = await db
    .select({ stockCount: productsTable.stockCount })
    .from(productsTable)
    .where(eq(productsTable.isArchived, false));
  const response = {
    todaySales,
    orderCount: orders.length,
    averageOrder: orders.length === 0 ? 0 : todaySales / orders.length,
    pendingOrders: 0,
    lowStockCount: products.filter((product) => product.stockCount <= 5).length,
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
  if (product.isArchived) {
    res.status(409).json({ error: "Archived products cannot receive new production batches" });
    return;
  }
  const created = await db.transaction(async (tx) => {
    const [log] = await tx
      .insert(operationLogsTable)
      .values({
        type: "batch_production",
        details: `${product.name}: ${parsed.data.servings} servings${parsed.data.note ? ` · ${parsed.data.note}` : ""}`,
        amount: "0",
        servings: parsed.data.servings,
        productId: product.id,
      })
      .returning();
    await tx
      .update(productsTable)
      .set({ stockCount: sql`${productsTable.stockCount} + ${parsed.data.servings}` })
      .where(eq(productsTable.id, product.id));
    return log;
  });
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