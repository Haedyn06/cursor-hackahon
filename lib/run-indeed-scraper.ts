import { existsSync } from "fs";
import path from "path";
import type { IndeedScraperJson } from "./job-types";

const PYTHON_CANDIDATES = [
  path.join(process.cwd(), ".venv-scraper/bin/python"),
  path.join(process.cwd(), ".venv-scraper/Scripts/python.exe"),
  "python3",
  "python",
];

function resolvePython(): string {
  for (const candidate of PYTHON_CANDIDATES) {
    if (candidate.includes("/") || candidate.includes("\\")) {
      if (existsSync(candidate)) return candidate;
    } else {
      return candidate;
    }
  }
  return "python3";
}

export async function runIndeedScraper(url: string): Promise<IndeedScraperJson> {
  const { spawn } = await import("child_process");

  const scriptPath = path.join(process.cwd(), "scripts/scrape_indeed_job.py");
  if (!existsSync(scriptPath)) {
    throw new Error("Indeed scraper script not found at scripts/scrape_indeed_job.py");
  }

  const python = resolvePython();

  return new Promise((resolve, reject) => {
    const proc = spawn(
      python,
      [scriptPath, url, "--skip-requests", "--quiet"],
      {
        cwd: process.cwd(),
        env: { ...process.env },
      }
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(
        new Error(
          `Could not run Python scraper (${python}). Install: pip install -r scripts/requirements-scraper.txt && playwright install chromium. ${err.message}`
        )
      );
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              "Indeed scraper failed. Try --headed mode locally or paste the JD manually."
          )
        );
        return;
      }

      try {
        const jsonStart = stdout.indexOf("{");
        const payload =
          jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;
        resolve(JSON.parse(payload) as IndeedScraperJson);
      } catch {
        reject(
          new Error(
            `Invalid scraper output. ${stderr ? stderr.slice(0, 200) : "No JSON returned."}`
          )
        );
      }
    });
  });
}
