import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Set or update a ranking (upsert)
export const setRanking = mutation({
  args: {
    userId: v.id("users"),
    artistId: v.id("artists"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.score < 1 || args.score > 10) {
      return { success: false, error: "Score must be between 1 and 10" };
    }

    const existing = await ctx.db
      .query("rankings")
      .withIndex("by_user_artist", (q) =>
        q.eq("userId", args.userId).eq("artistId", args.artistId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("rankings", {
        userId: args.userId,
        artistId: args.artistId,
        score: args.score,
        updatedAt: Date.now(),
      });
    }
    return { success: true };
  },
});

// Clear a ranking
export const clearRanking = mutation({
  args: {
    userId: v.id("users"),
    artistId: v.id("artists"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rankings")
      .withIndex("by_user_artist", (q) =>
        q.eq("userId", args.userId).eq("artistId", args.artistId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true };
  },
});

// Get user's rankings for a year (returns artistId -> score map)
export const getUserRankingsForYear = query({
  args: {
    userId: v.id("users"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const artists = await ctx.db
      .query("artists")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();

    const artistIds = new Set(artists.map((a) => a._id));

    const userRankings = await ctx.db
      .query("rankings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const rankingsMap: Record<string, number> = {};
    for (const ranking of userRankings) {
      if (artistIds.has(ranking.artistId)) {
        rankingsMap[ranking.artistId] = ranking.score;
      }
    }
    return rankingsMap;
  },
});
