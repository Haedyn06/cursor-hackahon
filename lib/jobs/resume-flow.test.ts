import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResumeMatchSummary,
  getResumeTabEmptyState,
} from "@/lib/jobs/resume-flow";

test("resume match summary stays empty until a resume is selected", () => {
  const summary = buildResumeMatchSummary({
    selectedResumeId: null,
    storedResumeId: null,
    matchScore: 87,
    matchedKeywords: ["React", "TypeScript"],
    missingKeywords: ["Python"],
  });

  assert.deepEqual(summary, {
    ready: false,
    score: null,
    matchedKeywords: [],
    missingKeywords: [],
  });
});

test("resume match summary uses stored match results after resume selection", () => {
  const summary = buildResumeMatchSummary({
    selectedResumeId: "resume-1",
    storedResumeId: "resume-1",
    matchScore: 87,
    matchedKeywords: ["React", "TypeScript"],
    missingKeywords: ["Python"],
  });

  assert.deepEqual(summary, {
    ready: true,
    score: 87,
    matchedKeywords: ["React", "TypeScript"],
    missingKeywords: ["Python"],
  });
});

test("resume tab empty state switches to selection-first copy when resumes exist", () => {
  assert.deepEqual(getResumeTabEmptyState({ hasLibraryResumes: true, hasSelectedResume: false }), {
    title: "Select a resume",
    description: "Choose one of your saved resumes to see the match score and tailor it for this job.",
    actionLabel: null,
  });
});

test("resume tab empty state keeps generate action when no resumes exist", () => {
  assert.deepEqual(getResumeTabEmptyState({ hasLibraryResumes: false, hasSelectedResume: false }), {
    title: "No resume yet",
    description: "Generate a tailored, ATS-optimized resume in seconds",
    actionLabel: "✦ Generate Resume",
  });
});
