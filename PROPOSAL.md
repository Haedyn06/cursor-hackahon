# Rezume
### AI-Powered Resume Builder & Job Hunt Command Center
**Cursor Calgary Hackathon @ SAIT — May 23–24, 2026**

---

## The Problem

Job hunters spend hours manually tailoring resumes for every application, end up with multiple untracked versions, forget to include relevant work and projects that could strengthen their case, and repeat the same copy-paste-into-ChatGPT-then-format-in-Word workflow every single time they apply. There is no single place that holds everything: their profile, their applications, their resumes, and their interview prep.

---

## Target User

Students and new graduates entering the job market for the first time — no professional resume writer, no system, multiple roles to apply to, and no money for a $30/month Teal subscription.

---

## The Solution

Rezume is an AI-powered resume builder that lets job hunters build a rich personal profile once, then generate perfectly tailored resumes, cover letters, and interview prep questions for any job posting — using their own AI API key, with no subscription required.

---

## Core Features (Priority Order)

### 1. AI Resume Tailoring
User pastes a job description. Rezume cross-references it against their full profile and base resume, then generates a tailored resume that surfaces the most relevant experience and skills — including projects and achievements they may have forgotten to include. A chat sidebar lets users fine-tune the output in real time.

### 2. Cover Letter Generation
One click after resume generation. The AI draws from the user's full profile — not just the resume — to write a cover letter that sounds like a real person, not a template.

### 3. Interview Prep Questions
Once a user marks a job as "applied" and gets an interview, they can return to that job posting and generate a full question bank: technical, behavioral, company culture, competitor awareness, product knowledge.

### 4. Job Board with Application Tracking
A personal job board where users can add job postings, track application status (Apply → Applied → Interview → Offer), and return to any listing to trigger resume tailoring or interview prep. Every generated resume is saved against the job it was built for.

---

## Key Differentiator: BYOK (Bring Your Own Key)

Users connect their own AI provider API key. Rezume supports 7 providers out of the box — including free tiers on Groq, NVIDIA NIM, and Gemini — meaning anyone can use Rezume without paying for an API subscription. The key is stored in session memory only and never persisted to the database.

**Supported providers:** OpenAI, Anthropic, Groq (free tier), DeepSeek, NVIDIA NIM (free tier), OpenRouter, Gemini (free tier)

### API Key Security

API keys are encrypted client-side using AES-GCM (Web Crypto API) before being sent to Convex. The encryption key is derived from the user's Clerk session and never leaves the browser. Convex only ever stores the encrypted blob — even a full database leak exposes nothing usable. Keys are decrypted in-browser when needed for API calls.

---

## The "Ultimate Profile" — Our Core Differentiator

A one-time setup where users build a master context document about themselves: full work history with detailed bullet points, every project with impact metrics, skills matrix, education, volunteer work, and a free-text "about me." This is the AI's source of truth — richer than any one-page resume — so it can surface relevant experience the user didn't think to include in their current resume.

This was inspired by a real document the team uses personally. The problem it solves is real.

---

## Demo Flow (2 Minutes)

1. **Sign in** via Clerk — fast, one click
2. **Onboarding:** Choose AI provider → input API key → key verified
3. **Build profile:** Upload or paste base resume + answer structured profile questions (target role, skills, about you, projects)
4. **Job Board:** Add a job posting — paste the JD and title
5. **Generate resume:** AI tailors the resume → live preview renders in the ATS-friendly template → chat sidebar open for adjustments → download PDF
6. **Cover letter:** One click → generated inline
7. **Mark as Applied** → job saved in board with status tracking
8. **Interview Prep:** Return to job → generate question bank (technical, behavioral, culture, competitors, products)

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js + shadcn/ui + Tailwind | Fast to build, Cursor-friendly, clean output |
| Auth | Clerk | Pre-built Convex integration, 1-2 hours setup |
| Backend / DB | Convex | Team has direct experience, real-time, serverless |
| AI Calls | Convex Actions (BYOK) | Bypasses CORS, user key passed per request, never stored |
| PDF Export | html2pdf.js | Browser-side, no server needed |
| Resume Template | Single ATS-optimized layout | JSON → HTML → PDF, AI controls content not structure |

---

## Database Schema (Simplified)

```
users         — Clerk ID, profile (target role, skills, about, experience level)
resumes       — userId, label, extracted text, createdAt
applications  — userId, job title, company, JD text, status, generated resume, cover letter
api_keys      — userId, provider, encryptedKey (AES-GCM blob), iv (initialization vector)
```

API keys are encrypted client-side with AES-GCM before storage. The encryption key is derived from the user's Clerk session token and never sent to Convex. Decryption happens in the browser at call time.

---

## What We're Not Building

- Auto job application (fragile, demo risk, wrong scope for 24h)
- Gmail integration (OAuth verification wall, 3-4h implementation cost)
- Multiple resume templates (CSS/PDF rabbit hole — one great template beats five mediocre ones)
- Authentication from scratch (Clerk handles it)

Both of the first two are framed as roadmap items in the demo.

---

## Team

**2 fullstack developers**

| Focus | Responsibility |
|---|---|
| Dev 1 | Auth + Convex schema + AI prompt engineering + Convex Actions (provider routing) |
| Dev 2 | UI/UX + resume template + PDF export + job board + chat sidebar |

Shared: onboarding flow, provider selection UI, integration testing

---

## Build Timeline (24 Hours)

| Block | Hours | Milestone |
|---|---|---|
| Setup: Next.js + Clerk + Convex + shadcn | 0–2h | Repo running, auth working |
| Schema + Convex CRUD + provider routing | 2–5h | DB live, AI calls working with test key |
| Onboarding + profile setup UI | 5–8h | User can build their profile |
| Resume input + JD paste + AI tailoring | 8–12h | Core loop working end-to-end |
| Resume preview + PDF export + chat sidebar | 12–15h | Downloadable resume |
| Cover letter generation | 15–16h | One-click cover letter |
| Job board + application tracking | 16–18h | Board with status tracking |
| Interview prep questions | 18–19h | Question bank generation |
| Provider selection UI + onboarding polish | 19–21h | Full onboarding flow |
| UI polish + bug fixes + demo prep | 21–24h | Submission ready |

---

## Judging Criteria Alignment

| Criterion | How Rezume Addresses It |
|---|---|
| **Problem relevance** | Built by students, for students — the team is literally the target user, actively job hunting post-graduation |
| **Execution** | Working end-to-end demo: profile → JD → tailored resume → download → job board |
| **Product quality** | Clerk + Convex + shadcn stack produces a polished, production-grade UI; single ATS-optimized template |
| **Use of Cursor** | Entire codebase built in Cursor; used for scaffolding, prompt engineering iteration, component generation |

---

## One-Line Pitch

> "Stop copy-pasting your resume into ChatGPT. Rezume knows everything about you and tailors your application in one click — using your own free AI key."