# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

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

- The checked-in code is still a minimal Next.js 16 App Router starter.
- `app/layout.tsx` defines the global shell and fonts.
- `app/page.tsx` is still starter content and does not yet reflect the product proposal.
- `app/globals.css` sets global tokens/styles and imports Tailwind v4 via `@import "tailwindcss"`.

## Intended Product Direction

- This repo is meant to become **Rezume**, an AI-powered resume builder and job application tracker.
- Planned primary stack: **Next.js + shadcn/ui + Tailwind + Clerk + Convex**.
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
