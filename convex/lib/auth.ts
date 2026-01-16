import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Validate a session token and return the userId if valid.
 * This should be called by mutations that need to verify the user.
 */
export async function validateSessionToken(
  ctx: QueryCtx | MutationCtx,
  token: string | null | undefined
): Promise<Id<"users"> | null> {
  if (!token) return null;

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;

  return session.userId;
}

/**
 * Require a valid session - throws if invalid.
 * Returns the authenticated user's ID.
 */
export async function requireSession(
  ctx: QueryCtx | MutationCtx,
  token: string | null | undefined
): Promise<Id<"users">> {
  const userId = await validateSessionToken(ctx, token);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Require admin role - throws if not authenticated or not an admin.
 * Returns the authenticated admin user's ID.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string | null | undefined
): Promise<Id<"users">> {
  const userId = await requireSession(ctx, token);
  const user = await ctx.db.get(userId);

  if (!user?.isAdmin) {
    throw new Error("Admin access required");
  }

  return userId;
}
