# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Principles

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Commands

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

There is currently no test script configured in `package.json`.

## Current Repo State

- The application is deployed on Vercel using the `production` branch (not `main`).
- It is a fully functional full-stack application built around the Rezume product vision.
- `app/page.tsx` & `app/layout.tsx` implement the main application shell, landing page, Clerk integration, and a ConvexClientProvider wrapper.
- The backend (`convex/`) contains schemas and query/mutation logic for core entities: jobs, users, onboarding, and settings.
- The domain logic (`lib/`) and frontend (`components/`) contain extensive implementations for AI resume and cover letter generation, document parsing (docx, PDF), and job tracking.
- `app/globals.css` sets global tokens/styles and imports Tailwind v4 via `@import "tailwindcss"`.

## Product Stack and Core Flow

- **Rezume**: An AI-powered resume builder and job application tracker.
- Stack: **Next.js 16 + Tailwind v4 + Clerk + Convex**.
- Core flow: sign in, choose AI provider + API key, build an “ultimate profile,” add job postings, generate tailored resumes / cover letters / interview prep, and track application status.

## Durable Product Constraints

- BYOK is core to the product: users bring their own AI provider key instead of paying for a platform subscription.
- Planned providers in the proposal: OpenAI, Anthropic, Groq, DeepSeek, NVIDIA NIM, OpenRouter, Gemini.
- API keys must be treated as client-owned secrets: encrypt client-side with AES-GCM / Web Crypto before storage, derive the key from the Clerk session, never persist plaintext keys, and decrypt only in-browser when needed.
- Resume export is planned as a **single ATS-optimized template** with a JSON → HTML → PDF pipeline (`html2pdf.js` in the proposal). AI should control content, not arbitrary document structure.

## Scope Guardrails From Proposal

- Do not expand scope into auto-apply flows, Gmail integration, multiple resume templates, or custom auth unless the user explicitly changes the plan.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **cursor-hackahon** (2130 symbols, 4313 relationships, 180 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/cursor-hackahon/context` | Codebase overview, check index freshness |
| `gitnexus://repo/cursor-hackahon/clusters` | All functional areas |
| `gitnexus://repo/cursor-hackahon/processes` | All execution flows |
| `gitnexus://repo/cursor-hackahon/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
