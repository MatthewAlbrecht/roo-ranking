import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

// Set or update a ranking (upsert)
// User identity is verified server-side via Convex Auth
export const setRanking = mutation({
  args: {
    artistId: v.id("artists"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID from session (throws if not authenticated)
    const userId = await requireAuth(ctx);

    if (args.score < 1 || args.score > 10) {
      return { success: false, error: "Score must be between 1 and 10" };
    }

    const existing = await ctx.db
      .query("rankings")
      .withIndex("by_user_artist", (q) =>
        q.eq("userId", userId).eq("artistId", args.artistId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("rankings", {
        userId,
        artistId: args.artistId,
        score: args.score,
        updatedAt: Date.now(),
      });
    }
    return { success: true };
  },
});

// Clear a ranking
// User identity is verified server-side via Convex Auth
export const clearRanking = mutation({
  args: {
    artistId: v.id("artists"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID from session (throws if not authenticated)
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("rankings")
      .withIndex("by_user_artist", (q) =>
        q.eq("userId", userId).eq("artistId", args.artistId)
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

// Get all other users' rankings for artists the current user has ranked
export const getOtherRankingsForYear = query({
  args: {
    userId: v.id("users"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    // Get artists for this year
    const artists = await ctx.db
      .query("artists")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
    const artistIdsForYear = new Set(artists.map((a) => a._id.toString()));

    // Get current user's rankings to know which artists they've rated
    const userRankings = await ctx.db
      .query("rankings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter to only this year's artists
    const ratedArtistIds = userRankings
      .filter((r) => artistIdsForYear.has(r.artistId.toString()))
      .map((r) => r.artistId);

    // Get all rankings for those artists from other users
    const otherRankings: Record<string, Array<{ userId: string; score: number }>> = {};

    for (const artistId of ratedArtistIds) {
      const rankings = await ctx.db
        .query("rankings")
        .withIndex("by_artist", (q) => q.eq("artistId", artistId))
        .collect();

      otherRankings[artistId] = rankings
        .filter((r) => r.userId.toString() !== args.userId.toString())
        .map((r) => ({ userId: r.userId.toString(), score: r.score }));
    }

    return otherRankings;
  },
});

// Get aggregate rankings for a year
export const getAggregateRankings = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    // Get all artists for the year
    const artists = await ctx.db
      .query("artists")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();

    // Get all rankings for these artists
    const results = await Promise.all(
      artists.map(async (artist) => {
        const rankings = await ctx.db
          .query("rankings")
          .withIndex("by_artist", (q) => q.eq("artistId", artist._id))
          .collect();

        const count = rankings.length;
        const avg = count > 0
          ? rankings.reduce((sum, r) => sum + r.score, 0) / count
          : null;

        return {
          artistId: artist._id,
          name: artist.name,
          avgScore: avg,
          ratingCount: count,
        };
      })
    );

    return results;
  },
});
