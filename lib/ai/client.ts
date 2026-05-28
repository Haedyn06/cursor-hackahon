import type { GeneratedInterviewPrep } from "@/lib/ai/interview-prep-generation";
import type { RefineInterviewPrepResult } from "@/lib/ai/refine-interview-prep";
import type { RefineCoverLetterResult } from "@/lib/ai/refine-cover-letter";
import type { GeneratedCoverLetter } from "@/lib/ai/cover-letter-generation";
import type { RefineResumeResult } from "@/lib/ai/refine-resume";
import type { GeneratedResumeAnalysis, JobContext } from "@/lib/ai/resume-generation";
import type {
  ApiProviderId,
  ChatMessage,
  CompleteResult,
  VerifyResult,
} from "@/lib/ai/types";
import type { InterviewPrepContent } from "@/lib/types/job-interview-prep";
import type { ResumeDocument } from "@/lib/resume-document";
import type { MockProfile } from "@/lib/mock-data";
import type { ProfileExportDocument } from "@/lib/profile-export-document";
import type { SourceMaterialRequestItem } from "@/lib/ai/source-material-request";
import type { OnboardingProfileState } from "@/lib/onboarding-storage";
import type { SourceMaterialRequestInput } from "@/lib/profile/source-material-input";

type ApiErrorBody = {
  error?: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let data: (T & ApiErrorBody) | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as T & ApiErrorBody;
    } catch {
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      throw new Error("Server returned an invalid response.");
    }
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed (${response.status})`);
  }

  if (!data) {
    throw new Error("Server returned an empty response.");
  }

  return data;
}

export async function verifyApiKey(
  providerId: ApiProviderId,
  apiKey: string,
): Promise<VerifyResult> {
  return postJson<VerifyResult>("/api/ai/verify", { providerId, apiKey });
}

export async function completeChat(params: {
  providerId: ApiProviderId;
  apiKey: string;
  messages: ChatMessage[];
  maxTokens?: number;
  model?: string;
}): Promise<CompleteResult> {
  return postJson<CompleteResult>("/api/ai/complete", params);
}

export async function generateTailoredResume(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
  sourceMaterials?: SourceMaterialRequestItem[];
}): Promise<GeneratedResumeAnalysis> {
  return postJson<GeneratedResumeAnalysis>("/api/ai/generate-resume", params);
}

export async function refineTailoredResume(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  resume: ResumeDocument;
  instruction: string;
  job?: JobContext;
  profile?: MockProfile;
}): Promise<RefineResumeResult> {
  return postJson<RefineResumeResult>("/api/ai/refine-resume", params);
}

export async function generateTailoredCoverLetter(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
  resume?: ResumeDocument | null;
  sourceMaterials?: SourceMaterialRequestItem[];
}): Promise<GeneratedCoverLetter> {
  return postJson<GeneratedCoverLetter>("/api/ai/generate-cover-letter", params);
}

export async function refineTailoredCoverLetter(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  content: string;
  instruction: string;
  job?: JobContext;
}): Promise<RefineCoverLetterResult> {
  return postJson<RefineCoverLetterResult>("/api/ai/refine-cover-letter", params);
}

export async function generateInterviewPrepGuide(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  job: JobContext;
  profile: MockProfile;
  resume?: ResumeDocument | null;
}): Promise<GeneratedInterviewPrep> {
  return postJson<GeneratedInterviewPrep>("/api/ai/generate-interview-prep", params);
}

export async function refineInterviewPrepGuide(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  prep: InterviewPrepContent;
  instruction: string;
  job?: JobContext;
}): Promise<RefineInterviewPrepResult> {
  return postJson<RefineInterviewPrepResult>("/api/ai/refine-interview-prep", params);
}

export async function formatProfileExport(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  profile: MockProfile;
}): Promise<{ document: ProfileExportDocument }> {
  return postJson<{ document: ProfileExportDocument }>("/api/ai/export-profile", params);
}

export async function autofillProfileFromDocuments(params: {
  providerId: ApiProviderId;
  apiKey: string;
  model?: string;
  pastedText?: string;
  uploads: Array<{ name: string; type: string; data: string }>;
}): Promise<{ profile: OnboardingProfileState; summary: string }> {
  return postJson<{ profile: OnboardingProfileState; summary: string }>(
    "/api/ai/autofill-profile",
    params,
  );
}
