#!/usr/bin/env python3
"""
Scrape an Indeed job posting (including private / applied links you can open while logged in).

Indeed blocks most simple HTTP clients. This script uses Playwright with a real browser
session. For applied or login-only views, run headed mode and complete login/CAPTCHA once.

Usage:
  pip install -r scripts/requirements-scraper.txt
  playwright install chromium

  python scripts/scrape_indeed_job.py "https://ca.indeed.com/viewjob?jk=..."

  # Save JSON + print summary
  python scripts/scrape_indeed_job.py "<url>" -o job.json

  # Visible browser (recommended for Indeed Canada + applied=1 links)
  python scripts/scrape_indeed_job.py "<url>" --headed --application-date 2026-05-23

  # Reuse saved browser profile (stays logged into Indeed)
  python scripts/scrape_indeed_job.py "<url>" --user-data-dir ~/.rezume-indeed-profile
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timezone
from typing import Any
from urllib.parse import parse_qs, urlparse


@dataclass
class IndeedJobMetadata:
    """Structured job metadata for Rezume / downstream pipelines."""

    job_name: str = ""
    company: str = ""
    type_of_work: str = ""
    type_of_salary: str = ""
    location: str = ""
    job_post_link: str = ""
    application_date: str | None = None
    job_details: str = ""
    job_key: str = ""
    source: str = "indeed"
    scraped_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if "indeed." not in parsed.netloc:
        raise ValueError("URL must be an indeed.com / indeed.* job link")
    qs = parse_qs(parsed.query)
    jk = (qs.get("jk") or [None])[0]
    if not jk:
        raise ValueError("Missing job key (?jk=...) in Indeed URL")
    # Canonical view URL (strip tracking noise, keep jk)
    base = f"{parsed.scheme}://{parsed.netloc}/viewjob"
    return f"{base}?jk={jk}"


def infer_application_date(url: str, cli_date: str | None) -> str | None:
    if cli_date:
        return cli_date
    qs = parse_qs(urlparse(url).query)
    if qs.get("applied"):
        return date.today().isoformat()
    return None


def clean_text(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def extract_json_ld_job(html: str) -> dict[str, Any]:
    """Parse JobPosting from application/ld+json blocks."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all("script", type="application/ld+json"):
        raw = tag.string or tag.get_text() or ""
        if not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        nodes = data if isinstance(data, list) else [data]
        for node in nodes:
            if not isinstance(node, dict):
                continue
            t = node.get("@type", "")
            types = t if isinstance(t, list) else [t]
            if any("JobPosting" in str(x) for x in types):
                return node
    return {}


def parse_job_posting_json_ld(ld: dict[str, Any], link: str) -> IndeedJobMetadata:
    org = ld.get("hiringOrganization") or {}
    company = org.get("name", "") if isinstance(org, dict) else str(org)

    employment = ld.get("employmentType", "")
    if isinstance(employment, list):
        employment = ", ".join(employment)

    salary = ""
    comp = ld.get("baseSalary") or ld.get("estimatedSalary")
    if isinstance(comp, dict):
        val = comp.get("value") or {}
        if isinstance(val, dict):
            mn, mx = val.get("minValue"), val.get("maxValue")
            unit = val.get("unitText") or comp.get("currency", "")
            if mn and mx:
                salary = f"{mn} – {mx} {unit}".strip()
            elif mn:
                salary = f"{mn} {unit}".strip()
        elif isinstance(val, (int, float)):
            salary = str(val)

    loc = ld.get("jobLocation", {})
    location = ""
    if isinstance(loc, dict):
        addr = loc.get("address") or {}
        if isinstance(addr, dict):
            parts = [
                addr.get("addressLocality"),
                addr.get("addressRegion"),
                addr.get("addressCountry"),
            ]
            location = ", ".join(p for p in parts if p)
    elif isinstance(loc, list) and loc:
        location = str(loc[0])

    desc = ld.get("description", "")
    if desc and "<" in desc:
        from bs4 import BeautifulSoup

        desc = BeautifulSoup(desc, "html.parser").get_text("\n", strip=True)

    return IndeedJobMetadata(
        job_name=clean_text(ld.get("title")),
        company=clean_text(company),
        type_of_work=clean_text(employment),
        type_of_salary=clean_text(salary),
        location=clean_text(location),
        job_post_link=ld.get("url") or link,
        job_details=desc.strip(),
        job_key=parse_qs(urlparse(link).query).get("jk", [""])[0],
    )


def scrape_with_playwright(
    url: str,
    *,
    headed: bool = False,
    user_data_dir: str | None = None,
    timeout_ms: int = 45_000,
) -> tuple[str, IndeedJobMetadata]:
    from playwright.sync_api import sync_playwright

    meta = IndeedJobMetadata(job_post_link=url, job_key=parse_qs(urlparse(url).query).get("jk", [""])[0])

    with sync_playwright() as p:
        launch_kwargs: dict[str, Any] = {
            "headless": not headed,
            "args": ["--disable-blink-features=AutomationControlled"],
        }
        if user_data_dir:
            context = p.chromium.launch_persistent_context(
                user_data_dir,
                channel="chromium",
                headless=not headed,
                viewport={"width": 1280, "height": 900},
                locale="en-CA",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()
        else:
            browser = p.chromium.launch(**launch_kwargs)
            context = browser.new_context(
                viewport={"width": 1280, "height": 900},
                locale="en-CA",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()

        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        # Indeed hydrates description client-side
        try:
            page.wait_for_selector("#jobDescriptionText", timeout=timeout_ms)
        except Exception:
            if headed:
                print(
                    "Waiting for you to solve CAPTCHA / log in, then load the job page…",
                    file=sys.stderr,
                )
                page.wait_for_timeout(60_000)
            else:
                page.wait_for_timeout(5_000)

        html = page.content()

        # --- DOM selectors (Indeed changes these periodically) ---
        def text(sel: str) -> str:
            loc = page.locator(sel)
            if loc.count() == 0:
                return ""
            return clean_text(loc.first.inner_text(timeout=3_000))

        meta.job_name = text("h1") or text('[data-testid="jobsearch-JobInfoHeader-title"]')
        meta.company = (
            text('[data-testid="inlineHeader-companyName"]')
            or text('[data-testid="jobsearch-CompanyInfoContainer"]')
            or text('[data-company-name="true"]')
        )
        meta.location = (
            text('[data-testid="inlineHeader-companyLocation"]')
            or text('[data-testid="job-location"]')
            or text('[data-testid="jobsearch-JobInfoHeader-subtitle"]')
        )

        salary_parts = []
        for sel in (
            "#salaryInfoAndJobType",
            '[data-testid="attribute_snippet_testid"]',
            '[data-testid="jobsearch-JobMetadataHeader-salary"]',
        ):
            t = text(sel)
            if t and t not in salary_parts:
                salary_parts.append(t)
        meta.type_of_salary = " · ".join(salary_parts)

        work_parts = []
        for sel in (
            "#jobDetailsSection",
            '[data-testid="job-details-jobsessionpanel"]',
        ):
            block = page.locator(sel).first
            if block.count():
                work_parts.append(clean_text(block.inner_text(timeout=3_000)))
        # Shorter job type chips
        chip_loc = page.locator('[data-testid="jobsearch-JobMetadataHeader-item"]')
        if chip_loc.count():
            chips = chip_loc.all_inner_texts()
            work_parts.extend([clean_text(c) for c in chips if c])
        meta.type_of_work = " · ".join(dict.fromkeys(p for p in work_parts if p))[:500]

        desc_loc = page.locator("#jobDescriptionText").first
        if desc_loc.count():
            meta.job_details = desc_loc.inner_text(timeout=5_000).strip()
        else:
            meta.job_details = text('[data-testid="jobsearch-JobComponent-description"]')

        # JSON-LD fallback / enrichment
        ld = extract_json_ld_job(html)
        if ld:
            ld_meta = parse_job_posting_json_ld(ld, url)
            meta.job_name = meta.job_name or ld_meta.job_name
            meta.company = meta.company or ld_meta.company
            meta.location = meta.location or ld_meta.location
            meta.type_of_work = meta.type_of_work or ld_meta.type_of_work
            meta.type_of_salary = meta.type_of_salary or ld_meta.type_of_salary
            meta.job_details = meta.job_details or ld_meta.job_details

        meta.extra["page_title"] = page.title()

        if user_data_dir:
            context.close()
        else:
            context.close()
            browser.close()

    return html, meta


def scrape_with_requests(url: str) -> IndeedJobMetadata | None:
    """Fast path — usually blocked by Indeed; kept as optional first attempt."""
    import requests
    from bs4 import BeautifulSoup

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-CA,en;q=0.9",
    }
    r = requests.get(url, headers=headers, timeout=20)
    if r.status_code != 200:
        return None
    html = r.text
    if "captcha" in html.lower() or "verify you are human" in html.lower():
        return None

    ld = extract_json_ld_job(html)
    if ld:
        return parse_job_posting_json_ld(ld, url)

    soup = BeautifulSoup(html, "html.parser")
    desc = soup.select_one("#jobDescriptionText")
    if not desc:
        return None
    meta = IndeedJobMetadata(job_post_link=url)
    meta.job_details = desc.get_text("\n", strip=True)
    h1 = soup.find("h1")
    if h1:
        meta.job_name = clean_text(h1.get_text())
    return meta


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape Indeed job posting metadata")
    parser.add_argument("url", help="Indeed viewjob URL (ca.indeed.com/viewjob?jk=...)")
    parser.add_argument(
        "-o", "--output", help="Write JSON metadata to this file", default=""
    )
    parser.add_argument(
        "--application-date",
        help="Your application date (ISO YYYY-MM-DD). Default: today if URL has applied=1",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Show browser (use for login-only / applied links)",
    )
    parser.add_argument(
        "--user-data-dir",
        help="Persistent Chromium profile directory (keeps Indeed login)",
    )
    parser.add_argument(
        "--skip-requests",
        action="store_true",
        help="Skip the quick requests attempt and go straight to Playwright",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only emit JSON on stdout (for API integration)",
    )
    args = parser.parse_args()

    def log(*a: object, **kw: object) -> None:
        if not args.quiet:
            print(*a, file=sys.stderr, **kw)

    original_url = args.url.strip()

    try:
        url = normalize_url(original_url)
    except ValueError as e:
        log(f"Error: {e}")
        return 1

    meta: IndeedJobMetadata | None = None

    if not args.skip_requests:
        try:
            meta = scrape_with_requests(url)
            if meta and meta.job_details:
                log("Fetched via HTTP (JSON-LD / static HTML).")
        except Exception as e:
            log(f"HTTP attempt failed: {e}")

    if not meta or not meta.job_details:
        log("Using Playwright browser scraper…")
        try:
            _, meta = scrape_with_playwright(
                url,
                headed=args.headed,
                user_data_dir=args.user_data_dir,
            )
        except Exception as e:
            log(f"Playwright scrape failed: {e}")
            if not args.quiet:
                log(
                    "\nTips:\n"
                    "  • Run with --headed and log into Indeed in the browser window\n"
                    "  • Use --user-data-dir ~/.rezume-indeed-profile to save the session\n"
                    "  • Pass --application-date YYYY-MM-DD for your apply date\n"
                )
            return 1

    meta.application_date = infer_application_date(original_url, args.application_date)
    meta.job_post_link = url

    if not meta.job_details:
        log(
            "Warning: empty job description — page may require login or blocked automation."
        )

    payload = meta.to_dict()
    text = json.dumps(payload, indent=2 if not args.quiet else None, ensure_ascii=False)
    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        log(f"Wrote {args.output}")
    else:
        print(text)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
