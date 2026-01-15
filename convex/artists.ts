import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add multiple artists at once (from newline-delimited text)
export const addArtists = mutation({
  args: { names: v.array(v.string()), year: v.number() },
  handler: async (ctx, args) => {
    const added: string[] = [];
    const skipped: string[] = [];

    for (const name of args.names) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      // Check for duplicates within same year
      const existing = await ctx.db
        .query("artists")
        .withIndex("by_name_year", (q) =>
          q.eq("name", trimmed).eq("year", args.year)
        )
        .unique();

      if (existing) {
        skipped.push(trimmed);
        continue;
      }

      await ctx.db.insert("artists", { name: trimmed, year: args.year });
      added.push(trimmed);
    }

    return { added, skipped };
  },
});

// Get all artists for a year
export const getArtistsByYear = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artists")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();
  },
});

// Delete an artist
export const deleteArtist = mutation({
  args: { artistId: v.id("artists") },
  handler: async (ctx, args) => {
    // Also delete all rankings for this artist
    const rankings = await ctx.db
      .query("rankings")
      .withIndex("by_artist", (q) => q.eq("artistId", args.artistId))
      .collect();

    for (const ranking of rankings) {
      await ctx.db.delete(ranking._id);
    }

    // Remove from any groups
    const groups = await ctx.db.query("groups").collect();
    for (const group of groups) {
      if (group.artistIds.includes(args.artistId)) {
        await ctx.db.patch(group._id, {
          artistIds: group.artistIds.filter((id) => id !== args.artistId),
        });
      }
    }

    await ctx.db.delete(args.artistId);
    return { success: true };
  },
});

// Get all years that have artists
export const getYearsWithArtists = query({
  args: {},
  handler: async (ctx) => {
    const artists = await ctx.db.query("artists").collect();
    const years = [...new Set(artists.map((a) => a.year))];
    return years.sort((a, b) => b - a); // Most recent first
  },
});
