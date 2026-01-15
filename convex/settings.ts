import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getActiveYear = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "activeYear"))
      .unique();
    return setting?.value ?? new Date().getFullYear();
  },
});

export const setActiveYear = mutation({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "activeYear"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.year });
    } else {
      await ctx.db.insert("settings", { key: "activeYear", value: args.year });
    }
    return { success: true };
  },
});
