export type ScrapedPage = {
  url: string;
  finalUrl: string;
  status: number;
  title: string;
  text: string;
  html: string;
  textLength: number;
  htmlLength: number;
  fetchedAt: string;
};

export type ExtractedJobFields = {
  position: string;
  company: string;
  location: string;
  incomeRange: string;
  workType: string;
  environmentType: string;
  jobDesc: string;
};

/** @deprecated Use position */
export type LegacyExtractedJobFields = ExtractedJobFields & {
  title?: string;
  salary?: string;
  source?: string;
  jd?: string;
};
