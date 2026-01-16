import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all groups for a year, sorted by order
export const getGroupsByYear = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
    return groups.sort((a, b) => a.order - b.order);
  },
});

// Get current and next groups for user view
export const getCurrentAndNextGroups = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();

    const current = groups.find((g) => g.status === "current") ?? null;
    const next = groups.find((g) => g.status === "next") ?? null;

    return { current, next };
  },
});

// Create a new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    year: v.number(),
    artistIds: v.array(v.id("artists")),
    status: v.union(v.literal("current"), v.literal("next"), v.null()),
  },
  handler: async (ctx, args) => {
    const existingGroups = await ctx.db
      .query("groups")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
    const maxOrder = existingGroups.reduce((max, g) => Math.max(max, g.order), -1);

    // Clear existing status if setting one
    if (args.status) {
      for (const group of existingGroups) {
        if (group.status === args.status) {
          await ctx.db.patch(group._id, { status: null });
        }
      }
    }

    await ctx.db.insert("groups", {
      name: args.name,
      year: args.year,
      artistIds: args.artistIds,
      status: args.status,
      order: maxOrder + 1,
    });

    return { success: true };
  },
});

// Update a group
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    artistIds: v.array(v.id("artists")),
    status: v.union(v.literal("current"), v.literal("next"), v.null()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return { success: false, error: "Group not found" };

    // Clear existing status if setting one
    if (args.status) {
      const existingGroups = await ctx.db
        .query("groups")
        .withIndex("by_year", (q) => q.eq("year", group.year))
        .collect();

      for (const g of existingGroups) {
        if (g._id !== args.groupId && g.status === args.status) {
          await ctx.db.patch(g._id, { status: null });
        }
      }
    }

    await ctx.db.patch(args.groupId, {
      name: args.name,
      artistIds: args.artistIds,
      status: args.status,
    });

    return { success: true };
  },
});

// Delete a group
export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.groupId);
    return { success: true };
  },
});
