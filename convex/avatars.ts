import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireSession } from "./lib/auth";

// Generate upload URL (admin only)
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

// Save uploaded avatar (admin only)
export const saveAvatar = mutation({
  args: {
    token: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    await ctx.db.insert("avatars", {
      storageId: args.storageId,
      name: args.name,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete avatar (admin only)
export const deleteAvatar = mutation({
  args: {
    token: v.string(),
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) {
      return { success: false, error: "Avatar not found" };
    }

    // Delete the file from storage
    await ctx.storage.delete(avatar.storageId);
    // Delete the record
    await ctx.db.delete(args.avatarId);

    return { success: true };
  },
});

// Get all avatars
export const getAllAvatars = query({
  args: {},
  handler: async (ctx) => {
    const avatars = await ctx.db.query("avatars").collect();

    // Get URLs for all avatars
    const avatarsWithUrls = await Promise.all(
      avatars.map(async (avatar) => ({
        _id: avatar._id,
        name: avatar.name,
        storageId: avatar.storageId,
        url: await ctx.storage.getUrl(avatar.storageId),
        createdAt: avatar.createdAt,
      }))
    );

    return avatarsWithUrls;
  },
});

// Set user's avatar image (authenticated user)
export const setUserAvatar = mutation({
  args: {
    token: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireSession(ctx, args.token);

    await ctx.db.patch(userId, {
      avatarImageId: args.storageId,
    });

    return { success: true };
  },
});

// Clear user's avatar image (go back to color)
export const clearUserAvatar = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireSession(ctx, args.token);

    await ctx.db.patch(userId, {
      avatarImageId: undefined,
    });

    return { success: true };
  },
});

// Get avatar URL for a storage ID
export const getAvatarUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Update avatar name (admin only)
export const updateAvatarName = mutation({
  args: {
    token: v.string(),
    avatarId: v.id("avatars"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar) {
      return { success: false, error: "Avatar not found" };
    }

    await ctx.db.patch(args.avatarId, { name: args.name });
    return { success: true };
  },
});

// Admin: Set any user's avatar image
export const adminSetUserAvatar = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(args.userId, {
      avatarImageId: args.storageId,
    });

    return { success: true };
  },
});
