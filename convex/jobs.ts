import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCurrentUser, getCurrentUserOrThrow } from "./users";

const jobStatusValidator = v.string();

const jobPatchValidator = v.object({
  title: v.optional(v.string()),
  company: v.optional(v.string()),
  location: v.optional(v.string()),
  status: v.optional(jobStatusValidator),
  matchScore: v.optional(v.union(v.number(), v.null())),
  source: v.optional(v.string()),
  url: v.optional(v.string()),
  jd: v.optional(v.string()),
  matchedKeywords: v.optional(v.array(v.string())),
  missingKeywords: v.optional(v.array(v.string())),
  resumeGenerated: v.optional(v.boolean()),
  coverLetterGenerated: v.optional(v.boolean()),
  interviewPrepGenerated: v.optional(v.boolean()),
  storedResume: v.optional(v.any()),
  storedCoverLetter: v.optional(v.any()),
  storedInterviewPrep: v.optional(v.any()),
  salary: v.optional(v.string()),
  deadline: v.optional(v.union(v.string(), v.null())),
  dateApplied: v.optional(v.union(v.string(), v.null())),
  followUp: v.optional(v.union(v.string(), v.null())),
  excitement: v.optional(v.number()),
});

export const listJobs = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("jobs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(200);
  },
});

export const getJob = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.userId !== user._id) {
      return null;
    }
    return job;
  },
});

export const createJob = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.string(),
    status: jobStatusValidator,
    matchScore: v.union(v.number(), v.null()),
    source: v.string(),
    dateAdded: v.string(),
    url: v.string(),
    jd: v.string(),
    matchedKeywords: v.array(v.string()),
    missingKeywords: v.array(v.string()),
    resumeGenerated: v.boolean(),
    coverLetterGenerated: v.boolean(),
    interviewPrepGenerated: v.boolean(),
    storedResume: v.optional(v.any()),
    storedCoverLetter: v.optional(v.any()),
    storedInterviewPrep: v.optional(v.any()),
    salary: v.string(),
    deadline: v.union(v.string(), v.null()),
    dateApplied: v.union(v.string(), v.null()),
    followUp: v.union(v.string(), v.null()),
    excitement: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await ensureCurrentUser(ctx);
    const now = Date.now();
    const jobId = await ctx.db.insert("jobs", {
      userId: user._id,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(jobId);
  },
});

export const updateJob = mutation({
  args: {
    id: v.id("jobs"),
    patch: jobPatchValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.userId !== user._id) {
      throw new Error("Job not found");
    }

    await ctx.db.patch(args.id, {
      ...args.patch,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

export const deleteJob = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const job = await ctx.db.get(args.id);
    if (!job || job.userId !== user._id) {
      throw new Error("Job not found");
    }
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

export const deleteJobs = mutation({
  args: { ids: v.array(v.id("jobs")) },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    let deleted = 0;

    for (const id of args.ids) {
      const job = await ctx.db.get(id);
      if (!job || job.userId !== user._id) {
        continue;
      }
      await ctx.db.delete(id);
      deleted += 1;
    }

    return { ok: true, deleted };
  },
});
