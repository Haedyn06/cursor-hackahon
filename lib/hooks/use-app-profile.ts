"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { MockProfile } from "@/lib/mock-data";
import {
  mapOnboardingStateToMockProfile,
  mapOnboardingStateToStoredProfile,
  type OnboardingStateSnapshot,
} from "@/lib/profile/onboarding-state-mapper";
import type { StoredProfile } from "@/lib/onboarding-storage";

export function useAppProfile() {
  const onboardingState = useQuery(api.onboarding.getOnboardingState);

  const storedProfile = useMemo(
    (): StoredProfile | undefined =>
      onboardingState === undefined
        ? undefined
        : mapOnboardingStateToStoredProfile(
            onboardingState as OnboardingStateSnapshot | null,
          ),
    [onboardingState],
  );

  const mockProfile = useMemo(
    (): MockProfile | undefined =>
      onboardingState === undefined
        ? undefined
        : mapOnboardingStateToMockProfile(
            onboardingState as OnboardingStateSnapshot | null,
          ),
    [onboardingState],
  );

  return {
    loading: onboardingState === undefined,
    onboardingState,
    storedProfile,
    profile: mockProfile,
  };
}
