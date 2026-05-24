# Job scrapers

## Indeed (Playwright)

Indeed blocks normal HTTP requests with a security check. Rezume uses a **Playwright browser scraper** for `indeed.com` / `indeed.ca` links.

### One-time setup

```bash
npm run setup:scraper
```

Or manually:

```bash
python3 -m venv .venv-scraper
source .venv-scraper/bin/activate
pip install -r scripts/requirements-scraper.txt
playwright install chromium
```

### Test from CLI

```bash
.venv-scraper/bin/python scripts/scrape_indeed_job.py \
  "https://ca.indeed.com/viewjob?jk=YOUR_JK_HERE" \
  --quiet --skip-requests
```

### How the app uses it

1. **Add Job → From link** with an Indeed URL
2. Server runs `scripts/scrape_indeed_job.py` (headless Chromium)
3. Job title, company, location, salary, and full description are saved — **no AI key required for Indeed**

### Notes

- Private / applied links (`applied=1`) may require login. Use `--headed` and `--user-data-dir ~/.rezume-indeed-profile` when testing locally.
- CAPTCHAs can still block headless mode on some networks. If import fails, paste the job manually.
