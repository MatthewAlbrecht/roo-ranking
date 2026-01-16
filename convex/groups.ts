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

// Create a new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    year: v.number(),
    artistIds: v.array(v.id("artists")),
  },
  handler: async (ctx, args) => {
    const existingGroups = await ctx.db
      .query("groups")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
    const maxOrder = existingGroups.reduce((max, g) => Math.max(max, g.order), -1);

    await ctx.db.insert("groups", {
      name: args.name,
      year: args.year,
      artistIds: args.artistIds,
      status: null,
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
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return { success: false, error: "Group not found" };

    await ctx.db.patch(args.groupId, {
      name: args.name,
      artistIds: args.artistIds,
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
