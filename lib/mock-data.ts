import jobs from "@/data/jobs.json";
import profile from "@/data/profile.json";
import resume from "@/data/resume.json";
import resumes from "@/data/resumes.json";
import onboardingResumes from "@/data/onboarding-resumes.json";
import type { Job } from "@/lib/types/job";

export type { Job, CreateJobInput, UpdateJobInput } from "@/lib/types/job";

export type MockResume = {
  id: number;
  title: string;
  matchJob: string | null;
  edited: string;
  color: string;
};

export type MockProfile = typeof profile;

export type OnboardingResume = {
  id: number;
  file: string;
  aiName: string;
  naming: boolean;
};

/** @deprecated Use `Job` */
export type MockJob = Job;

export const MOCK_JOBS = jobs as Job[];
export const MOCK_RESUMES = resumes as MockResume[];
export const MOCK_PROFILE = profile as MockProfile;
export const MOCK_RESUME = resume.content;
export const MOCK_ONBOARDING_RESUMES = onboardingResumes as OnboardingResume[];
