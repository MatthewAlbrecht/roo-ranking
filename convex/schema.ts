import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    password: v.string(),
    isAdmin: v.boolean(),
    avatarColor: v.string(),
    createdAt: v.number(),
    yearsAttended: v.optional(v.array(v.number())),
    questionnaire: v.optional(
      v.object({
        favoriteYear: v.optional(v.string()),
        memorableSet: v.optional(v.string()),
        worstSet: v.optional(v.string()),
        favoriteVendor: v.optional(v.string()),
        campEssential: v.optional(v.string()),
      })
    ),
    onboardingComplete: v.optional(v.boolean()),
  }).index("by_username", ["username"]),

  artists: defineTable({
    name: v.string(),
    year: v.number(),
  })
    .index("by_year", ["year"])
    .index("by_name_year", ["name", "year"]),

  groups: defineTable({
    name: v.string(),
    year: v.number(),
    artistIds: v.array(v.id("artists")),
    status: v.union(v.literal("current"), v.literal("next"), v.null()),
    order: v.number(),
  })
    .index("by_year", ["year"])
    .index("by_status", ["status"]),

  rankings: defineTable({
    userId: v.id("users"),
    artistId: v.id("artists"),
    score: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_artist", ["artistId"])
    .index("by_user_artist", ["userId", "artistId"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
