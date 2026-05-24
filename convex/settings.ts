import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUserOrThrow } from "./users";

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  resumeComplete: true,
  applicationReminders: false,
  weeklySummary: true,
} as const;

export type NotificationPreferences = {
  resumeComplete: boolean;
  applicationReminders: boolean;
  weeklySummary: boolean;
};

function resolveNotificationPreferences(user: {
  notifyResumeComplete?: boolean;
  notifyApplicationReminders?: boolean;
  notifyWeeklySummary?: boolean;
}): NotificationPreferences {
  return {
    resumeComplete:
      user.notifyResumeComplete ?? DEFAULT_NOTIFICATION_PREFERENCES.resumeComplete,
    applicationReminders:
      user.notifyApplicationReminders ??
      DEFAULT_NOTIFICATION_PREFERENCES.applicationReminders,
    weeklySummary:
      user.notifyWeeklySummary ?? DEFAULT_NOTIFICATION_PREFERENCES.weeklySummary,
  };
}

async function deleteRowsForUser(
  ctx: MutationCtx,
  table:
    | "profileLinks"
    | "profileSkills"
    | "profileExperienceEntries"
    | "profileLanguages"
    | "profileCertifications"
    | "profileProjects"
    | "profileEducation"
    | "aiProviderConnections"
    | "importedResumes"
    | "profileSourceMaterials"
    | "jobs",
  userId: Id<"users">,
) {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(500);

  for (const row of rows) {
    await ctx.db.delete(row._id);
  }

  return rows.length;
}

async function deleteImportedResumesForUser(ctx: MutationCtx, userId: Id<"users">) {
  const resumes = await ctx.db
    .query("importedResumes")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(500);

  for (const resume of resumes) {
    if (resume.storageId) {
      const linkedSource = await ctx.db
        .query("profileSourceMaterials")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("storageId"), resume.storageId))
        .first();

      if (!linkedSource) {
        await ctx.storage.delete(resume.storageId);
      }
    }
    await ctx.db.delete(resume._id);
  }

  return resumes.length;
}

async function deleteProfileSourceMaterialsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const materials = await ctx.db
    .query("profileSourceMaterials")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(500);

  for (const material of materials) {
    if (material.storageId) {
      await ctx.storage.delete(material.storageId);
    }
    await ctx.db.delete(material._id);
  }

  return materials.length;
}

export const getNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    return resolveNotificationPreferences(user);
  },
});

export const updateNotificationPreferences = mutation({
  args: {
    resumeComplete: v.optional(v.boolean()),
    applicationReminders: v.optional(v.boolean()),
    weeklySummary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const current = resolveNotificationPreferences(user);
    const next = {
      resumeComplete: args.resumeComplete ?? current.resumeComplete,
      applicationReminders:
        args.applicationReminders ?? current.applicationReminders,
      weeklySummary: args.weeklySummary ?? current.weeklySummary,
    };

    await ctx.db.patch(user._id, {
      notifyResumeComplete: next.resumeComplete,
      notifyApplicationReminders: next.applicationReminders,
      notifyWeeklySummary: next.weeklySummary,
      updatedAt: Date.now(),
    });

    return next;
  },
});

export const deleteAllResumeData = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await getCurrentUserOrThrow(ctx);
    const deletedJobs = await deleteRowsForUser(ctx, "jobs", user._id);
    const deletedImportedResumes = await deleteImportedResumesForUser(
      ctx,
      user._id,
    );

    return {
      ok: true,
      deletedJobs,
      deletedImportedResumes,
    };
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await getCurrentUserOrThrow(ctx);

    const deletedJobs = await deleteRowsForUser(ctx, "jobs", user._id);
    const deletedImportedResumes = await deleteImportedResumesForUser(
      ctx,
      user._id,
    );
    const deletedSourceMaterials = await deleteProfileSourceMaterialsForUser(
      ctx,
      user._id,
    );

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    await deleteRowsForUser(ctx, "profileLinks", user._id);
    await deleteRowsForUser(ctx, "profileSkills", user._id);
    await deleteRowsForUser(ctx, "profileExperienceEntries", user._id);
    await deleteRowsForUser(ctx, "profileLanguages", user._id);
    await deleteRowsForUser(ctx, "profileCertifications", user._id);
    await deleteRowsForUser(ctx, "profileProjects", user._id);
    await deleteRowsForUser(ctx, "profileEducation", user._id);
    await deleteRowsForUser(ctx, "aiProviderConnections", user._id);

    await ctx.db.delete(user._id);

    return {
      ok: true,
      deletedJobs,
      deletedImportedResumes,
      deletedSourceMaterials,
    };
  },
});
