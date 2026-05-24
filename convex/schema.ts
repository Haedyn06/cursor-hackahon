import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkSubject: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  profiles: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    location: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedin: v.string(),
    github: v.string(),
    portfolio: v.string(),
    targetRole: v.string(),
    experienceLevel: v.string(),
    about: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  profileLinks: defineTable({
    userId: v.id("users"),
    name: v.string(),
    url: v.string(),
    position: v.number(),
  }).index("by_userId", ["userId"]),

  profileSkills: defineTable({
    userId: v.id("users"),
    name: v.string(),
    position: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  profileExperienceEntries: defineTable({
    userId: v.id("users"),
    position: v.number(),
    title: v.string(),
    company: v.string(),
    dates: v.string(),
    bullets: v.string(),
  }).index("by_userId", ["userId"]),

  profileLanguages: defineTable({
    userId: v.id("users"),
    name: v.string(),
    level: v.string(),
    position: v.number(),
  }).index("by_userId", ["userId"]),

  profileCertifications: defineTable({
    userId: v.id("users"),
    name: v.string(),
    issuer: v.string(),
    date: v.string(),
    position: v.number(),
  }).index("by_userId", ["userId"]),

  aiProviderConnections: defineTable({
    userId: v.id("users"),
    providerId: v.string(),
    providerName: v.string(),
    connectionType: v.union(v.literal("apikey"), v.literal("oauth")),
    status: v.union(v.literal("connected"), v.literal("skipped")),
    lastVerifiedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_providerId", ["userId", "providerId"]),

  importedResumes: defineTable({
    userId: v.id("users"),
    storageId: v.optional(v.id("_storage")),
    fileName: v.string(),
    displayName: v.string(),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    sourceType: v.union(v.literal("upload"), v.literal("paste")),
    status: v.union(
      v.literal("pending"),
      v.literal("imported"),
      v.literal("parsed"),
      v.literal("failed"),
    ),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
