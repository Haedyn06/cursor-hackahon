import { query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("User not initialized");
  }

  return { identity, user };
}

export async function ensureCurrentUser(ctx: MutationCtx) {
  const identity = await requireIdentity(ctx);
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (existingUser) {
    return { identity, user: existingUser };
  }

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    clerkSubject: identity.subject,
    email: identity.email,
    name: identity.name,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  });

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to create user");
  }

  return { identity, user };
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});
