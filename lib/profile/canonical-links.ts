export type ProfileLinkInput = {
  name: string;
  url: string;
};

export type CanonicalProfileLinks = {
  linkedin: string;
  github: string;
  portfolio: string;
};

function matchesLink(
  link: ProfileLinkInput,
  keywords: string[],
  domains: string[],
): boolean {
  const name = link.name.toLowerCase();
  const url = link.url.trim().toLowerCase();
  if (!url) return false;
  return (
    keywords.some((keyword) => name.includes(keyword)) ||
    domains.some((domain) => url.includes(domain))
  );
}

export function extractCanonicalLinks(
  links: ProfileLinkInput[],
): CanonicalProfileLinks {
  let linkedin = "";
  let github = "";
  let portfolio = "";

  for (const link of links) {
    const url = link.url.trim();
    if (!url) continue;

    if (
      !linkedin &&
      matchesLink(link, ["linkedin"], ["linkedin.com"])
    ) {
      linkedin = url;
      continue;
    }

    if (!github && matchesLink(link, ["github"], ["github.com"])) {
      github = url;
      continue;
    }
  }

  for (const link of links) {
    const url = link.url.trim();
    if (!url) continue;

    const urlLower = url.toLowerCase();
    if (urlLower.includes("linkedin.com") || urlLower.includes("github.com")) {
      continue;
    }

    if (
      !portfolio &&
      matchesLink(link, ["portfolio", "website", "personal", "site"], [])
    ) {
      portfolio = url;
      break;
    }
  }

  if (!portfolio) {
    for (const link of links) {
      const url = link.url.trim();
      if (!url) continue;

      const urlLower = url.toLowerCase();
      if (urlLower.includes("linkedin.com") || urlLower.includes("github.com")) {
        continue;
      }

      portfolio = url;
      break;
    }
  }

  return { linkedin, github, portfolio };
}
