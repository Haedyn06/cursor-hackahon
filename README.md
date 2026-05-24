# Rezume

AI-powered resume builder and job application tracker. Build a rich profile once, add job postings, and generate tailored resumes, cover letters, and interview prep — using **your own** AI API key, with no platform subscription.

Built for the **Cursor Calgary Hackathon @ SAIT** (May 23–24, 2026). See [PROPOSAL.md](./PROPOSAL.md) for the full product brief.

## Features

- **Ultimate profile** — Structured work history, projects, skills, certifications, and links as the AI source of truth (richer than a one-page resume).
- **Job board** — Add jobs manually, paste a description, or import from a URL (Indeed supported via Playwright scraper).
- **AI resume tailoring** — Match job keywords to your profile and generate an ATS-friendly resume with live preview and chat refinement.
- **Cover letters & interview prep** — One-click generation tied to each job posting.
- **Application tracker** — Kanban-style pipeline from Saved → Applying → Applied → Interview → Offer → Accepted.
- **BYOK (Bring Your Own Key)** — Connect OpenAI, Anthropic, Groq, Gemini, Mistral, or Together AI. Free tiers work on several providers.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Auth | [Clerk](https://clerk.com) |
| Backend | [Convex](https://convex.dev) (users, profiles, jobs) |
| AI | Server routes call providers with the user’s key per request |
| Export | Single ATS template → HTML → PDF (`html2pdf.js`) / DOCX |

## Prerequisites

- Node.js 20+
- npm
- [Clerk](https://clerk.com) application with a **Convex** JWT template (`applicationID: convex`)
- [Convex](https://convex.dev) project linked to this repo
- An API key from at least one supported AI provider (Groq and Gemini offer free tiers)

Optional (Indeed job import):

- Python 3.10+
- Playwright + Chromium (`npm run setup:scraper`)

## Quick start

```bash
# Install dependencies
npm install

# Configure environment (see below), then start Convex + Next.js
npx convex dev          # terminal 1 — syncs backend, writes .env.local
npm run dev             # terminal 2 — http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), sign in, complete onboarding (provider + API key), then use **Profile**, **Jobs**, **Resumes**, and **Tracker** from the app shell.

## Environment variables

Create `.env.local` in the project root (Convex dev often adds `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` automatically).

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL for the browser client |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key (server) |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain for Convex auth (`convex` template) |

Optional:

| Variable | Description |
|----------|-------------|
| `REZUME_PYTHON` | Path to Python binary for the Indeed scraper (defaults to venv under `.venv-scraper`) |

Clerk must expose a JWT template named **`convex`** so API routes can authenticate to Convex. See [Convex + Clerk auth](https://docs.convex.dev/auth/clerk).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run setup:scraper` | Python venv + Playwright for Indeed imports |

## Project layout

```
app/
  page.tsx              # Landing page
  onboarding/           # Provider selection & profile setup
  (app)/                # Authenticated shell
    profile/            # Ultimate profile editor
    jobs/               # Job board
    resumes/            # Resume / cover letter / interview prep library
    tracker/            # Application pipeline
    settings/           # AI provider & preferences
  api/                  # AI generation, job CRUD, scraping
components/             # UI, wizards, ATS resume template
convex/                 # Schema, users, jobs, onboarding mutations
lib/                    # AI clients, export, scraping, types
scripts/                # Indeed Playwright scraper (see scripts/README.md)
```

## API keys & privacy

- Keys are entered during onboarding or in **Settings**, verified against the provider, then kept **in the browser** (`localStorage` / `sessionStorage`).
- Keys are sent to this app’s API routes only when you run AI features; they are **not** stored in Convex as plaintext.
- Treat your key like a password. Clear it from Settings or clear site data if you use a shared machine.

## Indeed job import

Indeed blocks simple HTTP scraping. For `indeed.com` / `indeed.ca` URLs, Rezume runs a headless Chromium script. Setup and CLI usage: [scripts/README.md](./scripts/README.md).

## Scope (intentional limits)

Per the product proposal, Rezume does **not** include auto-apply, Gmail sync, multiple resume templates, or custom auth. Those are out of scope unless the plan changes.

## License

Private hackathon project (`"private": true` in `package.json`). Add a license file if you open-source the repo.
