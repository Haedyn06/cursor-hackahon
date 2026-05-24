import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureCurrentUser, getCurrentUserOrThrow } from "./users";

const providerConnectionValidator = v.object({
  providerId: v.string(),
  providerName: v.string(),
  connectionType: v.union(v.literal("apikey"), v.literal("oauth")),
  status: v.union(v.literal("connected"), v.literal("skipped")),
  lastVerifiedAt: v.optional(v.number()),
});

const profileValidator = v.object({
  fullName: v.string(),
  location: v.string(),
  email: v.string(),
  phone: v.string(),
  linkedin: v.string(),
  github: v.string(),
  portfolio: v.string(),
  targetRole: v.string(),
  experienceLevel: v.string(),
  about: v.string(),
  links: v.array(
    v.object({
      name: v.string(),
      url: v.string(),
    }),
  ),
  skills: v.array(v.string()),
  languages: v.array(
    v.object({
      name: v.string(),
      level: v.string(),
    }),
  ),
  certifications: v.array(
    v.object({
      name: v.string(),
      issuer: v.string(),
      date: v.string(),
    }),
  ),
  experienceEntries: v.array(
    v.object({
      title: v.string(),
      company: v.string(),
      dates: v.string(),
      bullets: v.string(),
    }),
  ),
});

const importedResumeValidator = v.object({
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
});

export const getOnboardingState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return {
        user: null,
        profile: null,
        links: [],
        skills: [],
        experienceEntries: [],
        languages: [],
        certifications: [],
        providerConnections: [],
        importedResumes: [],
      };
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const links = await ctx.db
      .query("profileLinks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    const skills = await ctx.db
      .query("profileSkills")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    const experienceEntries = await ctx.db
      .query("profileExperienceEntries")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const languages = await ctx.db
      .query("profileLanguages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    const certifications = await ctx.db
      .query("profileCertifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    const providerConnections = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const importedResumes = await ctx.db
      .query("importedResumes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    return {
      user,
      profile,
      links,
      skills,
      experienceEntries,
      languages,
      certifications,
      providerConnections,
      importedResumes,
    };
  },
});

export const saveProviderConnections = mutation({
  args: {
    connections: v.array(providerConnectionValidator),
  },
  handler: async (ctx, args) => {
    const { user } = await ensureCurrentUser(ctx);
    const existing = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    const now = Date.now();
    for (const connection of args.connections) {
      await ctx.db.insert("aiProviderConnections", {
        userId: user._id,
        providerId: connection.providerId,
        providerName: connection.providerName,
        connectionType: connection.connectionType,
        status: connection.status,
        lastVerifiedAt: connection.lastVerifiedAt,
        updatedAt: now,
      });
    }

    return { ok: true };
  },
});

export const saveProfile = mutation({
  args: {
    profile: profileValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await ensureCurrentUser(ctx);
    const now = Date.now();

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const profileData = {
      userId: user._id,
      fullName: args.profile.fullName,
      location: args.profile.location,
      email: args.profile.email,
      phone: args.profile.phone,
      linkedin: args.profile.linkedin,
      github: args.profile.github,
      portfolio: args.profile.portfolio,
      targetRole: args.profile.targetRole,
      experienceLevel: args.profile.experienceLevel,
      about: args.profile.about,
      updatedAt: now,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
    } else {
      await ctx.db.insert("profiles", profileData);
    }

    const existingLinks = await ctx.db
      .query("profileLinks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(200);
    for (const row of existingLinks) {
      await ctx.db.delete(row._id);
    }

    for (const [position, link] of args.profile.links.entries()) {
      await ctx.db.insert("profileLinks", {
        userId: user._id,
        name: link.name,
        url: link.url,
        position,
      });
    }

    const existingSkills = await ctx.db
      .query("profileSkills")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(200);
    for (const row of existingSkills) {
      await ctx.db.delete(row._id);
    }

    for (const [position, skill] of args.profile.skills.entries()) {
      await ctx.db.insert("profileSkills", {
        userId: user._id,
        name: skill,
        position,
      });
    }

    const existingLanguages = await ctx.db
      .query("profileLanguages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);
    for (const row of existingLanguages) {
      await ctx.db.delete(row._id);
    }

    for (const [position, language] of args.profile.languages.entries()) {
      await ctx.db.insert("profileLanguages", {
        userId: user._id,
        name: language.name,
        level: language.level,
        position,
      });
    }

    const existingCertifications = await ctx.db
      .query("profileCertifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);
    for (const row of existingCertifications) {
      await ctx.db.delete(row._id);
    }

    for (const [position, certification] of args.profile.certifications.entries()) {
      await ctx.db.insert("profileCertifications", {
        userId: user._id,
        name: certification.name,
        issuer: certification.issuer,
        date: certification.date,
        position,
      });
    }

    const existingEntries = await ctx.db
      .query("profileExperienceEntries")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);
    for (const row of existingEntries) {
      await ctx.db.delete(row._id);
    }

    for (const [position, entry] of args.profile.experienceEntries.entries()) {
      await ctx.db.insert("profileExperienceEntries", {
        userId: user._id,
        position,
        title: entry.title,
        company: entry.company,
        dates: entry.dates,
        bullets: entry.bullets,
      });
    }

    return { ok: true };
  },
});

export const generateResumeUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await ensureCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveImportedResumes = mutation({
  args: {
    resumes: v.array(importedResumeValidator),
  },
  handler: async (ctx, args) => {
    const { user } = await ensureCurrentUser(ctx);
    const existing = await ctx.db
      .query("importedResumes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    for (const row of existing) {
      if (row.storageId) {
        await ctx.storage.delete(row.storageId);
      }
      await ctx.db.delete(row._id);
    }

    const now = Date.now();
    for (const resume of args.resumes) {
      await ctx.db.insert("importedResumes", {
        userId: user._id,
        storageId: resume.storageId,
        fileName: resume.fileName,
        displayName: resume.displayName,
        mimeType: resume.mimeType,
        sizeBytes: resume.sizeBytes,
        sourceType: resume.sourceType,
        status: resume.status,
        createdAt: now,
      });
    }

    return { ok: true };
  },
});

export const deleteImportedResume = mutation({
  args: {
    resumeId: v.id("importedResumes"),
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const resume = await ctx.db.get(args.resumeId);

    if (!resume || resume.userId !== user._id) {
      throw new Error("Resume not found");
    }

    if (resume.storageId) {
      await ctx.storage.delete(resume.storageId);
    }

    await ctx.db.delete(resume._id);
    return { ok: true };
  },
});

export const renameImportedResume = mutation({
  args: {
    resumeId: v.id("importedResumes"),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const resume = await ctx.db.get(args.resumeId);

    if (!resume || resume.userId !== user._id) {
      throw new Error("Resume not found");
    }

    await ctx.db.patch(resume._id, {
      displayName: args.displayName,
    });
    return { ok: true };
  },
});

export const savePastedResume = mutation({
  args: {
    fileName: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await ensureCurrentUser(ctx);
    const now = Date.now();
    await ctx.db.insert("importedResumes", {
      userId: user._id,
      fileName: args.fileName,
      displayName: args.displayName,
      sourceType: "paste",
      status: "imported",
      createdAt: now,
    });
    return { ok: true };
  },
});

export const clearImportedResumes = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const existing = await ctx.db
      .query("importedResumes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);

    for (const row of existing) {
      if (row.storageId) {
        await ctx.storage.delete(row.storageId);
      }
      await ctx.db.delete(row._id);
    }

    return { ok: true };
  },
});

export const getResumeDownloadUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const listImportedResumes = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("importedResumes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100);
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await ensureCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const initializeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await ensureCurrentUser(ctx);
    return user;
  },
});
