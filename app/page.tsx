"use client";

import { SignInButton, SignOutButton, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const auth = useConvexAuth();
  const { isSignedIn } = useAuth();
  const serverAuth = useQuery(api.debug.authProbe);

  useEffect(() => {
    console.log("auth", auth);
  }, [auth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Clerk + Convex auth probe
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Use the temporary login controls below, then check the browser console and Convex logs.
        </p>
        <div className="mt-6 flex items-center gap-3">
          {isSignedIn ? (
            <>
              <UserButton />
              <SignOutButton>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-black dark:border-zinc-700 dark:text-zinc-50">
                  Sign out
                </button>
              </SignOutButton>
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <div>
            <span className="font-medium text-black dark:text-zinc-50">Frontend:</span>{" "}
            <span className="text-zinc-600 dark:text-zinc-400">
              {auth.isLoading
                ? "Loading auth..."
                : auth.isAuthenticated
                  ? "Authenticated"
                  : "Not authenticated"}
            </span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-zinc-50">Backend:</span>{" "}
            <span className="text-zinc-600 dark:text-zinc-400">
              {serverAuth === undefined
                ? "Checking server identity..."
                : serverAuth.isAuthenticated
                  ? `Authenticated (${serverAuth.tokenIdentifier})`
                  : "No server identity"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
