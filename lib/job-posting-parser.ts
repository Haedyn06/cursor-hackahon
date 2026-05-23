export interface ParsedJobPosting {
  jobTitle: string;
  company: string;
  jdText: string;
  url: string;
  source: string;
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(html: string) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  text = text
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function metaContent(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return "";
}

function titleFromHtml(html: string) {
  const og = metaContent(html, "og:title");
  if (og) return og.split("|")[0]?.split(" - ")[0]?.trim() ?? og;

  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t?.[1]) {
    const raw = decodeHtmlEntities(t[1].trim());
    return raw.split("|")[0]?.split(" - ")[0]?.trim() ?? raw;
  }
  return "";
}

function companyFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts[0] === "jobs" && parts.length > 2) return capitalize(parts[1]);
    if (["boards", "careers", "jobs"].includes(parts[0]) && parts.length > 2) {
      return capitalize(parts[1]);
    }
    return capitalize(parts[0].replace(/-/g, " "));
  } catch {
    return "";
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function companyFromHtml(html: string, url: string) {
  const site = metaContent(html, "og:site_name");
  if (site) return site;

  const org = metaContent(html, "application-name");
  if (org) return org;

  return companyFromUrl(url);
}

function parseJsonLdJob(html: string): Partial<ParsedJobPosting> {
  const scripts = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  for (const match of scripts) {
    try {
      const raw = match[1].trim();
      const data = JSON.parse(raw) as unknown;
      const nodes = Array.isArray(data) ? data : [data];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const obj = node as Record<string, unknown>;
        const type = String(obj["@type"] ?? "");
        const types = Array.isArray(obj["@type"])
          ? obj["@type"].map(String)
          : [type];

        if (!types.some((t) => /JobPosting/i.test(t))) continue;

        const hiring = obj.hiringOrganization as Record<string, unknown> | undefined;
        const desc =
          typeof obj.description === "string"
            ? stripHtml(obj.description)
            : "";

        return {
          jobTitle: typeof obj.title === "string" ? obj.title : "",
          company:
            typeof hiring?.name === "string"
              ? hiring.name
              : typeof obj.hiringOrganization === "string"
                ? obj.hiringOrganization
                : "",
          jdText: desc,
        };
      }
    } catch {
      /* try next script block */
    }
  }

  return {};
}

function inferSource(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("greenhouse")) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("indeed")) return "Indeed";
    if (host.includes("glassdoor")) return "Glassdoor";
    return host;
  } catch {
    return "Web";
  }
}

export function parseJobHtml(html: string, url: string): ParsedJobPosting {
  const jsonLd = parseJsonLdJob(html);
  const bodyText = stripHtml(html);
  const ogDesc = metaContent(html, "og:description");
  const metaDesc = metaContent(html, "description");

  let jdText =
    jsonLd.jdText ||
    ogDesc ||
    metaDesc ||
    bodyText;

  if (jdText === bodyText && jdText.length > 12000) {
    jdText = jdText.slice(0, 12000);
  }

  const jobTitle = jsonLd.jobTitle || titleFromHtml(html) || "";
  const company = jsonLd.company || companyFromHtml(html, url) || "";

  return {
    jobTitle,
    company,
    jdText: jdText.trim(),
    url,
    source: inferSource(url),
  };
}

export function isValidJobUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
