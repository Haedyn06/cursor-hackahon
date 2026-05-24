import jobs from "@/data/jobs.json";
import profile from "@/data/profile.json";
import resume from "@/data/resume.json";
import resumes from "@/data/resumes.json";
import onboardingResumes from "@/data/onboarding-resumes.json";
import type { JobStatus } from "@/lib/constants";

export type MockJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  status: JobStatus;
  matchScore: number | null;
  source: string;
  dateAdded: string;
  url: string;
  jd: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  resumeGenerated: boolean;
  salary: string;
  deadline: string | null;
  dateApplied: string | null;
  followUp: string | null;
  excitement: number;
};

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

export const MOCK_JOBS = jobs as MockJob[];
export const MOCK_RESUMES = resumes as MockResume[];
export const MOCK_PROFILE = profile as MockProfile;
export const MOCK_RESUME = resume.content;
export const MOCK_ONBOARDING_RESUMES = onboardingResumes as OnboardingResume[];
