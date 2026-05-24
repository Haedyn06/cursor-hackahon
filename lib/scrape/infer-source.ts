export function inferSourceFromUrl(rawUrl: string): string {
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();

    if (hostname.includes("linkedin.com")) return "LinkedIn";
    if (hostname.includes("indeed.com")) return "Indeed";
    if (hostname.includes("greenhouse.io")) return "Company Site";
    if (hostname.includes("lever.co")) return "Company Site";
    if (hostname.includes("ashbyhq.com")) return "Company Site";
    if (hostname.includes("myworkdayjobs.com")) return "Company Site";
    if (hostname.includes("github.com")) return "GitHub Jobs";
  } catch {
    // Fall through.
  }

  return "Other";
}
