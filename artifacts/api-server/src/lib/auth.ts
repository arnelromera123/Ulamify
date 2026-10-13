import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { and, eq, gt, lte } from "drizzle-orm";
import type { RolePermission } from "@workspace/api-zod";
import {
  authSessionsTable,
  db,
  userRolesTable,
  usersTable,
} from "@workspace/db";

const SESSION_COOKIE = "ulamify_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

type AuthenticatedUser = {
  id: number;
  role: string;
  permissions: RolePermission[];
};

type LoginAttempt = { count: number; blockedUntil: number };
const loginAttempts = new Map<string, LoginAttempt>();

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [algorithm, saltHex, hashHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = scryptSync(pin, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

let pinMigration: Promise<void> | undefined;

export function migratePlaintextPins(): Promise<void> {
  pinMigration ??= (async () => {
    const users = await db
      .select({ id: usersTable.id, pin: usersTable.pin, role: usersTable.role })
      .from(usersTable);
    const hasLegacyDefaultOwner = users.some(
      (user) => user.role === "owner" && user.pin === "1234",
    );
    const bootstrapPin = process.env.ADMIN_BOOTSTRAP_PIN ?? "";
    if (hasLegacyDefaultOwner && !/^\d{4,6}$/.test(bootstrapPin)) {
      throw new Error(
        "Set ADMIN_BOOTSTRAP_PIN to a 4-6 digit PIN to replace the legacy default Owner/Admin PIN.",
      );
    }
    for (const user of users) {
      if (!user.pin.startsWith("scrypt$")) {
        const plainPin =
          user.role === "owner" && user.pin === "1234"
            ? bootstrapPin
            : user.pin;
        await db
          .update(usersTable)
          .set({ pin: hashPin(plainPin) })
          .where(eq(usersTable.id, user.id));
      }
    }
  })().catch((error: unknown) => {
    pinMigration = undefined;
    throw error;
  });
  return pinMigration;
}

export async function createSession(
  userId: number,
  res: Response,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db
    .delete(authSessionsTable)
    .where(lte(authSessionsTable.expiresAt, new Date()));
  await db.insert(authSessionsTable).values({
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/api",
    expires: expiresAt,
  });
}

export async function revokeSession(
  req: Request,
  res: Response,
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token.length > 0) {
    await db
      .delete(authSessionsTable)
      .where(eq(authSessionsTable.tokenHash, hashSessionToken(token)));
  }
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    path: "/api",
  });
}

export async function loadSessionUser(
  req: Request,
): Promise<AuthenticatedUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length === 0) return null;

  const [session] = await db
    .select({
      userId: authSessionsTable.userId,
      role: usersTable.role,
      isActive: usersTable.isActive,
      permissions: userRolesTable.permissions,
    })
    .from(authSessionsTable)
    .innerJoin(usersTable, eq(authSessionsTable.userId, usersTable.id))
    .innerJoin(userRolesTable, eq(usersTable.role, userRolesTable.code))
    .where(
      and(
        eq(authSessionsTable.tokenHash, hashSessionToken(token)),
        gt(authSessionsTable.expiresAt, new Date()),
        eq(usersTable.isActive, true),
      ),
    )
    .limit(1);

  if (!session) return null;
  return {
    id: session.userId,
    role: session.role,
    permissions: session.permissions as RolePermission[],
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await loadSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    res.locals.authenticatedUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(...permissions: RolePermission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (
      user.role !== "owner" &&
      !permissions.some((permission) => user.permissions.includes(permission))
    ) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export function requireOwner(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;
  if (user?.role !== "owner") {
    res.status(user ? 403 : 401).json({
      error: user ? "Owner/Admin access required" : "Authentication required",
    });
    return;
  }
  next();
}

export function requireOwnerOrManager(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = res.locals.authenticatedUser as AuthenticatedUser | undefined;
  if (user?.role !== "owner" && user?.role !== "manager") {
    res.status(user ? 403 : 401).json({
      error: user ? "Owner/Admin or Manager access required" : "Authentication required",
    });
    return;
  }
  next();
}

export function getAuthenticatedUser(res: Response): AuthenticatedUser | null {
  return (
    (res.locals.authenticatedUser as AuthenticatedUser | undefined) ?? null
  );
}

export function loginIsBlocked(key: string): boolean {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;
  if (attempt.blockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return attempt.count >= 5;
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  const next =
    !attempt || attempt.blockedUntil <= now
      ? { count: 1, blockedUntil: now + 15 * 60 * 1000 }
      : { ...attempt, count: attempt.count + 1 };
  loginAttempts.set(key, next);
  if (loginAttempts.size > 10_000) {
    for (const [attemptKey, value] of loginAttempts) {
      if (value.blockedUntil <= now) loginAttempts.delete(attemptKey);
    }
  }
}

export function clearFailedLogins(key: string): void {
  loginAttempts.delete(key);
}

export { hashPin };
