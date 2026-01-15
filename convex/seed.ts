import { mutation } from "./_generated/server";

export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "matt"))
      .unique();

    if (existing) {
      return { status: "already_exists", userId: existing._id };
    }

    // Create admin user
    const userId = await ctx.db.insert("users", {
      username: "matt",
      password: "bonnaroo",
      isAdmin: true,
      avatarColor: "#f59e0b", // amber-500 to match theme
      createdAt: Date.now(),
    });

    // Also set default active year
    const existingYear = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "activeYear"))
      .unique();

    if (!existingYear) {
      await ctx.db.insert("settings", {
        key: "activeYear",
        value: 2025,
      });
    }

    return { status: "created", userId };
  },
});
