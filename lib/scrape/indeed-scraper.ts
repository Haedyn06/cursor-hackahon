import "server-only";

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { AiProviderError } from "@/lib/ai/errors";
import {
  mapIndeedToExtracted,
  mapIndeedToScrapedPage,
  type IndeedJobMetadata,
} from "@/lib/scrape/indeed";
import type { ExtractedJobFields, ScrapedPage } from "@/lib/scrape/types";
import { assertScrapeableUrl } from "@/lib/scrape/validate-url";

const SCRAPE_TIMEOUT_MS = 90_000;

function resolvePythonBinary(): string {
  if (process.env.REZUME_PYTHON?.trim()) {
    return process.env.REZUME_PYTHON.trim();
  }

  const venvPython = path.join(process.cwd(), ".venv-scraper/bin/python");
  if (existsSync(venvPython)) {
    return venvPython;
  }

  return "python3";
}

function resolveIndeedScraperScript(): string {
  return path.join(process.cwd(), "scripts/scrape_indeed_job.py");
}

function parseIndeedError(output: string): string {
  if (output.includes("Executable doesn't exist") || output.includes("playwright install")) {
    return "Indeed scraper needs Playwright. Run: npm run setup:scraper";
  }

  if (output.includes("CAPTCHA") || output.includes("login")) {
    return "Indeed blocked automation. Try a public job link or enter details manually.";
  }

  if (output.trim()) {
    return output.trim().split("\n").slice(-3).join(" ");
  }

  return "Failed to scrape Indeed job posting.";
}

function parseIndeedOutput(stdout: string, stderr: string): IndeedJobMetadata {
  const trimmed = stdout.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as IndeedJobMetadata;
  }

  const jsonLine = trimmed
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("{"));

  if (jsonLine) {
    return JSON.parse(jsonLine) as IndeedJobMetadata;
  }

  throw new Error(parseIndeedError(stderr || stdout));
}

async function runIndeedPythonScraper(rawUrl: string): Promise<IndeedJobMetadata> {
  const python = resolvePythonBinary();
  const script = resolveIndeedScraperScript();

  if (!existsSync(script)) {
    throw new AiProviderError("Indeed scraper script is missing.", 500);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(python, [script, rawUrl, "--skip-requests"], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new AiProviderError("Indeed scrape timed out.", 504));
    }, SCRAPE_TIMEOUT_MS);

    proc.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    proc.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new AiProviderError(
          error.message.includes("ENOENT")
            ? "Python not found. Run: npm run setup:scraper"
            : "Failed to start Indeed scraper.",
          500,
        ),
      );
    });

    proc.on("close", (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        reject(new AiProviderError(parseIndeedError(stderr || stdout), 422));
        return;
      }

      try {
        resolve(parseIndeedOutput(stdout, stderr));
      } catch (error) {
        reject(
          new AiProviderError(
            error instanceof Error ? error.message : "Invalid Indeed scraper output.",
            502,
          ),
        );
      }
    });
  });
}

export async function scrapeIndeedJobPage(rawUrl: string): Promise<{
  scraped: ScrapedPage;
  extracted: ExtractedJobFields;
}> {
  assertScrapeableUrl(rawUrl);
  const meta = await runIndeedPythonScraper(rawUrl);

  if (!meta.job_details?.trim()) {
    throw new AiProviderError(
      "Indeed returned an empty job description. The listing may require login — try manual entry.",
      422,
    );
  }

  return {
    scraped: mapIndeedToScrapedPage(meta, rawUrl),
    extracted: mapIndeedToExtracted(meta),
  };
}
