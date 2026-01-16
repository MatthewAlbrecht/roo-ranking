import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Generate a secure random token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Login - creates a session and returns token
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    const isValid = await bcrypt.compare(args.password, user.password);
    if (!isValid) {
      return { success: false, error: "Invalid username or password" };
    }

    // Create a new session
    const token = generateToken();
    const now = Date.now();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: now + SESSION_DURATION_MS,
      createdAt: now,
    });

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        avatarColor: user.avatarColor,
        yearsAttended: user.yearsAttended,
        questionnaire: user.questionnaire,
        onboardingComplete: user.onboardingComplete,
      },
    };
  },
});

// Logout - invalidates the session
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Validate session and get user
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

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

// Get userId from session token (for internal use in mutations)
export const getSessionUserId = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    return session.userId;
  },
});
