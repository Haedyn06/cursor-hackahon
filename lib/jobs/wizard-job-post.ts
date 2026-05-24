import type { Job } from "@/lib/types/job";
import { jobDescription, jobMatchLabel } from "@/lib/jobs/job-context";

export type WizardJobSource = "saved" | "new" | null;
export type WizardNewJobMode = "manual" | "link" | "paste" | "file";

export type WizardJobForm = {
  position: string;
  company: string;
  jobDesc: string;
  url: string;
  pastedText: string;
  incomeRange: string;
  workType: string;
  environmentType: string;
};

export type WizardJobContext = {
  position: string;
  company: string;
  matchJob: string;
  jobDesc: string;
  location?: string;
  incomeRange?: string;
  workType?: string;
  environmentType?: string;
};

export const EMPTY_WIZARD_JOB_FORM: WizardJobForm = {
  position: "",
  company: "",
  jobDesc: "",
  url: "",
  pastedText: "",
  incomeRange: "",
  workType: "",
  environmentType: "",
};

export function resolveWizardJobContext(params: {
  jobSource: WizardJobSource;
  selectedJob: Job | null;
  newJobMode: WizardNewJobMode;
  form: WizardJobForm;
}): WizardJobContext | null {
  if (params.jobSource === "saved" && params.selectedJob) {
    return {
      position: params.selectedJob.position,
      company: params.selectedJob.company,
      matchJob: jobMatchLabel(params.selectedJob),
      jobDesc: jobDescription(params.selectedJob),
      location: params.selectedJob.location || undefined,
      incomeRange: params.selectedJob.incomeRange || undefined,
      workType: params.selectedJob.workType || undefined,
      environmentType: params.selectedJob.environmentType || undefined,
    };
  }

  if (params.jobSource !== "new") {
    return null;
  }

  const { form, newJobMode } = params;
  const position = form.position.trim();
  const company = form.company.trim();
  const jobDesc =
    form.jobDesc.trim() ||
    (newJobMode === "paste" ? form.pastedText.trim() : "");

  if (!position || !company) {
    return null;
  }

  return {
    position,
    company,
    matchJob: `${position} @ ${company}`,
    jobDesc: jobDesc || `${position} at ${company}`,
    incomeRange: form.incomeRange.trim() || undefined,
    workType: form.workType.trim() || undefined,
    environmentType: form.environmentType.trim() || undefined,
  };
}

export function canContinueWizardJobStep(params: {
  jobSource: WizardJobSource;
  selectedJobId: string | null;
  newJobMode: WizardNewJobMode;
  form: WizardJobForm;
}): boolean {
  if (params.jobSource === "saved") {
    return !!params.selectedJobId;
  }

  if (params.jobSource !== "new") {
    return false;
  }

  const position = params.form.position.trim();
  const company = params.form.company.trim();

  if (params.newJobMode === "manual") {
    return !!position && !!company;
  }

  if (params.newJobMode === "link") {
    return !!position && !!company && params.form.jobDesc.trim().length >= 40;
  }

  if (params.newJobMode === "paste") {
    return (
      !!position &&
      !!company &&
      (params.form.jobDesc.trim().length >= 40 ||
        params.form.pastedText.trim().length >= 80)
    );
  }

  if (params.newJobMode === "file") {
    return !!position && !!company && params.form.jobDesc.trim().length >= 40;
  }

  return false;
}
