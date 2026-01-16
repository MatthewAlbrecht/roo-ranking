import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { requireSession, requireAdmin, validateSessionToken } from "./lib/auth";

const SALT_ROUNDS = 10;

const questionnaireValidator = v.object({
  favoriteYear: v.optional(v.string()),
  memorableSet: v.optional(v.string()),
  worstSet: v.optional(v.string()),
  favoriteVendor: v.optional(v.string()),
  campEssential: v.optional(v.string()),
});

// Login is now in convex/auth.ts

// TEMPORARY: Reset password by username (no auth required) - DELETE AFTER USE
export const tempResetPassword = mutation({
  args: { username: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const hashedPassword = bcrypt.hashSync(args.newPassword, SALT_ROUNDS);
    await ctx.db.patch(user._id, { password: hashedPassword });

    return { success: true };
  },
});

// Get user by ID (for session restoration) - legacy, use getCurrentUser instead
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
      avatarImageId: user.avatarImageId,
      yearsAttended: user.yearsAttended,
      questionnaire: user.questionnaire,
      onboardingComplete: user.onboardingComplete,
    };
  },
});

// Get current authenticated user (uses session token)
export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await validateSessionToken(ctx, args.token);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      avatarColor: user.avatarColor,
      avatarImageId: user.avatarImageId,
      yearsAttended: user.yearsAttended,
      questionnaire: user.questionnaire,
      onboardingComplete: user.onboardingComplete,
    };
  },
});

// Get all users (for admin)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const usersWithAvatars = await Promise.all(
      users.map(async (user) => ({
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        avatarColor: user.avatarColor,
        avatarImageId: user.avatarImageId,
        avatarImageUrl: user.avatarImageId
          ? await ctx.storage.getUrl(user.avatarImageId)
          : null,
        createdAt: user.createdAt,
      }))
    );
    return usersWithAvatars;
  },
});

// Get all users with profile info (for user avatars display)
export const getAllUsersWithProfiles = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const usersWithAvatars = await Promise.all(
      users.map(async (user) => ({
        _id: user._id,
        username: user.username,
        avatarColor: user.avatarColor,
        avatarImageId: user.avatarImageId,
        avatarImageUrl: user.avatarImageId
          ? await ctx.storage.getUrl(user.avatarImageId)
          : null,
        yearsAttended: user.yearsAttended,
        questionnaire: user.questionnaire,
      }))
    );
    return usersWithAvatars;
  },
});

// Get user by username (for profile page)
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
      avatarImageId: user.avatarImageId,
      avatarImageUrl: user.avatarImageId
        ? await ctx.storage.getUrl(user.avatarImageId)
        : null,
      yearsAttended: user.yearsAttended,
      questionnaire: user.questionnaire,
    };
  },
});

// Create user (admin only)
export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    avatarColor: v.string(),
    avatarImageId: v.optional(v.id("_storage")),
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

    // Hash password
    const hashedPassword = bcrypt.hashSync(args.password, SALT_ROUNDS);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: hashedPassword,
      isAdmin: false,
      avatarColor: args.avatarColor,
      avatarImageId: args.avatarImageId,
      createdAt: Date.now(),
    });

    return { success: true, userId };
  },
});

// Self-registration (public)
export const register = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    avatarColor: v.string(),
    avatarImageId: v.optional(v.id("_storage")),
    yearsAttended: v.optional(v.array(v.number())),
    questionnaire: v.optional(questionnaireValidator),
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

    // Validate password length
    if (args.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(args.password, SALT_ROUNDS);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: hashedPassword,
      isAdmin: false,
      avatarColor: args.avatarColor,
      avatarImageId: args.avatarImageId,
      createdAt: Date.now(),
      yearsAttended: args.yearsAttended,
      questionnaire: args.questionnaire,
      onboardingComplete: true,
    });

    return {
      success: true,
      user: {
        _id: userId,
        username: args.username,
        isAdmin: false,
        avatarColor: args.avatarColor,
      },
    };
  },
});

// Check if username is available
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    return { available: !existing };
  },
});

// Update user profile (authenticated user only)
export const updateProfile = mutation({
  args: {
    token: v.string(),
    avatarColor: v.optional(v.string()),
    yearsAttended: v.optional(v.array(v.number())),
    questionnaire: v.optional(questionnaireValidator),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await requireSession(ctx, args.token);

    const updates: Record<string, unknown> = {};
    if (args.avatarColor !== undefined) updates.avatarColor = args.avatarColor;
    if (args.yearsAttended !== undefined) updates.yearsAttended = args.yearsAttended;
    if (args.questionnaire !== undefined) updates.questionnaire = args.questionnaire;

    await ctx.db.patch(userId, updates);
    return { success: true };
  },
});

// Complete onboarding for existing users (authenticated user only)
export const completeOnboarding = mutation({
  args: {
    token: v.string(),
    avatarColor: v.string(),
    avatarImageId: v.optional(v.id("_storage")),
    yearsAttended: v.optional(v.array(v.number())),
    questionnaire: v.optional(questionnaireValidator),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await requireSession(ctx, args.token);

    await ctx.db.patch(userId, {
      avatarColor: args.avatarColor,
      avatarImageId: args.avatarImageId,
      yearsAttended: args.yearsAttended,
      questionnaire: args.questionnaire,
      onboardingComplete: true,
    });

    return { success: true };
  },
});

// Change password (authenticated user only)
export const changePassword = mutation({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireSession(ctx, args.token);
    const user = await ctx.db.get(userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isValid = bcrypt.compareSync(args.currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password length
    if (args.newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    // Hash and update
    const hashedPassword = bcrypt.hashSync(args.newPassword, SALT_ROUNDS);
    await ctx.db.patch(userId, { password: hashedPassword });

    return { success: true };
  },
});

// Reset user password (admin only - verified server-side)
export const resetPassword = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify caller is an admin
    await requireAdmin(ctx, args.token);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Hash and update
    const hashedPassword = bcrypt.hashSync(args.newPassword, SALT_ROUNDS);
    await ctx.db.patch(args.userId, { password: hashedPassword });

    return { success: true };
  },
});

// Update user avatar color (admin only - verified server-side)
export const updateUserColor = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    avatarColor: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify caller is an admin
    await requireAdmin(ctx, args.token);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(args.userId, { avatarColor: args.avatarColor });
    return { success: true };
  },
});

// Delete user (admin only - verified server-side)
export const deleteUser = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify caller is an admin
    await requireAdmin(ctx, args.token);

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

    // Delete all sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.userId);
    return { success: true };
  },
});
