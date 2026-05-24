import type { Job } from "@/lib/types/job";

export type WizardJobSource = "saved" | "new" | null;
export type WizardNewJobMode = "manual" | "link" | "paste" | "file";

export type WizardJobForm = {
  title: string;
  company: string;
  jd: string;
  url: string;
  pastedText: string;
};

export type WizardJobContext = {
  title: string;
  company: string;
  matchJob: string;
  description: string;
  url?: string;
};

export const EMPTY_WIZARD_JOB_FORM: WizardJobForm = {
  title: "",
  company: "",
  jd: "",
  url: "",
  pastedText: "",
};

export function resolveWizardJobContext(params: {
  jobSource: WizardJobSource;
  selectedJob: Job | null;
  newJobMode: WizardNewJobMode;
  form: WizardJobForm;
}): WizardJobContext | null {
  if (params.jobSource === "saved" && params.selectedJob) {
    return {
      title: params.selectedJob.title,
      company: params.selectedJob.company,
      matchJob: `${params.selectedJob.title} @ ${params.selectedJob.company}`,
      description:
        params.selectedJob.jd.trim() ||
        `${params.selectedJob.title} at ${params.selectedJob.company}`,
      url: params.selectedJob.url || undefined,
    };
  }

  if (params.jobSource !== "new") {
    return null;
  }

  const { form, newJobMode } = params;
  const title = form.title.trim();
  const company = form.company.trim();
  const jd =
    form.jd.trim() ||
    (newJobMode === "paste" ? form.pastedText.trim() : "");

  if (!title || !company) {
    return null;
  }

  return {
    title,
    company,
    matchJob: `${title} @ ${company}`,
    description: jd || `${title} at ${company}`,
    url: form.url.trim() || undefined,
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

  const title = params.form.title.trim();
  const company = params.form.company.trim();

  if (params.newJobMode === "manual") {
    return !!title && !!company;
  }

  if (params.newJobMode === "link") {
    return !!title && !!company && params.form.jd.trim().length >= 40;
  }

  if (params.newJobMode === "paste") {
    return (
      !!title &&
      !!company &&
      (params.form.jd.trim().length >= 40 || params.form.pastedText.trim().length >= 80)
    );
  }

  if (params.newJobMode === "file") {
    return !!title && !!company && params.form.jd.trim().length >= 40;
  }

  return false;
}
