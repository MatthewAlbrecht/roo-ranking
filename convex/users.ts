import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const questionnaireValidator = v.object({
  favoriteYear: v.optional(v.string()),
  memorableSet: v.optional(v.string()),
  worstSet: v.optional(v.string()),
  favoriteVendor: v.optional(v.string()),
  campEssential: v.optional(v.string()),
});

// Login - returns user if credentials match, null otherwise
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return null;
    }

    // Compare password with bcrypt
    const isValid = await bcrypt.compare(args.password, user.password);
    if (!isValid) {
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
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
    }));
  },
});

// Get all users with profile info (for user avatars display)
export const getAllUsersWithProfiles = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
      yearsAttended: user.yearsAttended,
      questionnaire: user.questionnaire,
    }));
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
    const hashedPassword = await bcrypt.hash(args.password, SALT_ROUNDS);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: hashedPassword,
      isAdmin: false,
      avatarColor: args.avatarColor,
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
    const hashedPassword = await bcrypt.hash(args.password, SALT_ROUNDS);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: hashedPassword,
      isAdmin: false,
      avatarColor: args.avatarColor,
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

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    avatarColor: v.optional(v.string()),
    yearsAttended: v.optional(v.array(v.number())),
    questionnaire: v.optional(questionnaireValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const updates: Record<string, unknown> = {};
    if (args.avatarColor !== undefined) updates.avatarColor = args.avatarColor;
    if (args.yearsAttended !== undefined) updates.yearsAttended = args.yearsAttended;
    if (args.questionnaire !== undefined) updates.questionnaire = args.questionnaire;

    await ctx.db.patch(args.userId, updates);
    return { success: true };
  },
});

// Complete onboarding for existing users
export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
    avatarColor: v.string(),
    yearsAttended: v.optional(v.array(v.number())),
    questionnaire: v.optional(questionnaireValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(args.userId, {
      avatarColor: args.avatarColor,
      yearsAttended: args.yearsAttended,
      questionnaire: args.questionnaire,
      onboardingComplete: true,
    });

    return { success: true };
  },
});

// Change password
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isValid = await bcrypt.compare(args.currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password length
    if (args.newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(args.newPassword, SALT_ROUNDS);
    await ctx.db.patch(args.userId, { password: hashedPassword });

    return { success: true };
  },
});

// Reset user password (admin only)
export const resetPassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(args.newPassword, SALT_ROUNDS);
    await ctx.db.patch(args.userId, { password: hashedPassword });

    return { success: true };
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
