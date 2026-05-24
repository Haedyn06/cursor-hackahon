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
  title: string;
  company: string;
  location: string;
  salary: string;
  source: string;
  jd: string;
};
