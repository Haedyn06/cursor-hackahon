import { AiProviderError } from "@/lib/ai/errors";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function assertScrapeableUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new AiProviderError("Invalid URL.", 400);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AiProviderError("Only http and https URLs are supported.", 400);
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || isPrivateIpv4(hostname)) {
    throw new AiProviderError("This URL cannot be scraped.", 400);
  }

  if (hostname.endsWith(".local")) {
    throw new AiProviderError("This URL cannot be scraped.", 400);
  }

  return url;
}
