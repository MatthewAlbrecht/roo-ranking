import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the authenticated user's ID from the auth context.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // The subject is the user ID we returned from the Password verify function
  return identity.subject as Id<"users">;
}

/**
 * Require authentication - throws if not authenticated.
 * Returns the authenticated user's ID.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await getAuthenticatedUserId(ctx);
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
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  const user = await ctx.db.get(userId);

  if (!user?.isAdmin) {
    throw new Error("Admin access required");
  }

  return userId;
}
