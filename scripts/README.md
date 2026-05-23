# Indeed job scraper

`scrape_indeed_job.py` extracts full job metadata from an Indeed posting URL.

## Setup

```bash
python -m venv .venv-scraper
source .venv-scraper/bin/activate
pip install -r scripts/requirements-scraper.txt
playwright install chromium
```

## Example (your link)

```bash
python scripts/scrape_indeed_job.py \
  "https://ca.indeed.com/viewjob?jk=5d4ec7690b71a151&applied=1" \
  --headed \
  --user-data-dir ~/.rezume-indeed-profile \
  -o scripts/output/indeed-job.json
```

## Output fields

| Field | Description |
|--------|-------------|
| `job_name` | Role title |
| `company` | Employer |
| `type_of_work` | Full-time / part-time / remote chips & details section |
| `type_of_salary` | Salary text from Indeed |
| `location` | City / region |
| `job_post_link` | Canonical Indeed URL |
| `application_date` | From `--application-date` or today when `applied=1` is in the URL |
| `job_details` | Full description text (`#jobDescriptionText`) |
| `job_key` | Indeed `jk` id |
| `scraped_at` | UTC timestamp |

## Rezume web app integration

When you add a job from an **Indeed URL** in the Rezume UI:

1. `POST /api/analyze-job` spawns this script (`--quiet`)
2. Server runs AI metadata identification (`lib/ai-job-analyzer.ts`)
3. Job is saved to your board with metadata
4. Resume builder tailors using JD + identified skills

Requires `.venv-scraper` + Playwright installed on the machine running `npm run dev`.

## Notes

- **Private / applied links** (`applied=1`) usually need you logged in — use `--headed` once, then reuse `--user-data-dir`.
- Indeed often shows CAPTCHAs for bots; a visible browser session avoids most issues.
- **Application date** is not on the public posting; pass it explicitly if you know when you applied.
