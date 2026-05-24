import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkSubject: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    notifyResumeComplete: v.optional(v.boolean()),
    notifyApplicationReminders: v.optional(v.boolean()),
    notifyWeeklySummary: v.optional(v.boolean()),
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

  profileProjects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    url: v.string(),
    desc: v.string(),
    active: v.boolean(),
    position: v.number(),
  }).index("by_userId", ["userId"]),

  profileEducation: defineTable({
    userId: v.id("users"),
    degree: v.string(),
    school: v.string(),
    dates: v.string(),
    gpa: v.string(),
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

  profileSourceMaterials: defineTable({
    userId: v.id("users"),
    storageId: v.optional(v.id("_storage")),
    label: v.string(),
    fileName: v.string(),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    sourceKind: v.union(v.literal("autofill"), v.literal("import")),
    inputKind: v.union(v.literal("upload"), v.literal("paste")),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  jobs: defineTable({
    userId: v.id("users"),
    company: v.string(),
    location: v.optional(v.string()),
    status: v.string(),
    matchScore: v.optional(v.union(v.number(), v.null())),
    position: v.optional(v.string()),
    jobDesc: v.optional(v.string()),
    resume: v.optional(v.any()),
    coverLetter: v.optional(v.any()),
    interviewPrep: v.optional(v.any()),
    incomeRange: v.optional(v.string()),
    workType: v.optional(v.string()),
    environmentType: v.optional(v.string()),
    // Legacy fields kept for documents created before metadata migration
    title: v.optional(v.string()),
    jd: v.optional(v.string()),
    salary: v.optional(v.string()),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    dateAdded: v.optional(v.string()),
    matchedKeywords: v.optional(v.array(v.string())),
    missingKeywords: v.optional(v.array(v.string())),
    resumeGenerated: v.optional(v.boolean()),
    coverLetterGenerated: v.optional(v.boolean()),
    interviewPrepGenerated: v.optional(v.boolean()),
    storedResume: v.optional(v.any()),
    storedCoverLetter: v.optional(v.any()),
    storedInterviewPrep: v.optional(v.any()),
    deadline: v.optional(v.union(v.string(), v.null())),
    dateApplied: v.optional(v.union(v.string(), v.null())),
    followUp: v.optional(v.union(v.string(), v.null())),
    excitement: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_status", ["userId", "status"]),
});
