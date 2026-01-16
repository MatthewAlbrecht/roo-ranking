import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Login - returns user if credentials match, null otherwise
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user || user.password !== args.password) {
      return null;
    }

    return {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      avatarColor: user.avatarColor,
    };
  },
});

// Get user by ID (for session restoration)
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      avatarColor: user.avatarColor,
    };
  },
});

// Get all users (for admin)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
    }));
  },
});

// Create user (admin only)
export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    avatarColor: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) {
      return { success: false, error: "Username already exists" };
    }

    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: args.password,
      isAdmin: false,
      avatarColor: args.avatarColor,
      createdAt: Date.now(),
    });

    return { success: true, userId };
  },
});

// Update user avatar color (admin only)
export const updateUserColor = mutation({
  args: {
    userId: v.id("users"),
    avatarColor: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(args.userId, { avatarColor: args.avatarColor });
    return { success: true };
  },
});

// Delete user (admin only)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Delete all rankings by this user
    const rankings = await ctx.db
      .query("rankings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const ranking of rankings) {
      await ctx.db.delete(ranking._id);
    }

    await ctx.db.delete(args.userId);
    return { success: true };
  },
});
