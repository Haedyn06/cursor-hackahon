/**
 * Heuristic extraction of ATS-relevant keywords from job postings.
 * Used to steer resume generation and to score keyword coverage post-generation.
 */

export type JobKeywordSource = {
  position?: string;
  company?: string;
  jobDesc: string;
  /** @deprecated Use position */
  title?: string;
  /** @deprecated Use jobDesc */
  description?: string;
};

const KNOWN_TERMS = [
  "React",
  "React.js",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "C#",
  ".NET",
  "Azure",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Git",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "GraphQL",
  "REST",
  "API",
  "Microservices",
  "Agile",
  "Scrum",
  "DevOps",
  "TDD",
  "Unit Testing",
  "Playwright",
  "Jest",
  "Tailwind CSS",
  "CSS",
  "HTML",
  "Redux",
  "Vue",
  "Angular",
  "Spring Boot",
  "FastAPI",
  "Django",
  "Flask",
  "Redis",
  "Kafka",
  "Terraform",
  "Linux",
  "Figma",
  "UI/UX",
  "Accessibility",
  "WCAG",
  "Performance Optimization",
  "System Design",
  "Machine Learning",
  "LLM",
  "AI",
  "Data Analysis",
  "ETL",
  "Snowflake",
  "Databricks",
  "Power BI",
  "Tableau",
  "Salesforce",
  "SAP",
  "Stakeholder Management",
  "Cross-functional",
  "Technical Leadership",
  "Mentorship",
  "Code Review",
  "Full Stack",
  "Frontend",
  "Backend",
  "Cloud-native",
  "Serverless",
  "Lambda",
  "S3",
  "EC2",
  "OAuth",
  "JWT",
  "Security",
  "Compliance",
  "Payments",
  "FinTech",
  "SaaS",
  "B2B",
  "B2C",
  "Mobile",
  "iOS",
  "Android",
  "Swift",
  "Kotlin",
  "Rust",
  "Go",
  "Golang",
  "C++",
  "Embedded",
  "IoT",
  "Blockchain",
  "Web3",
  "Problem Solving",
  "Communication",
  "Leadership",
  "Collaboration",
  "Ownership",
  "Initiative",
  "Detail-oriented",
  "Self-starter",
  "Fast-paced",
  "Scale",
  "High-impact",
  "Best Practices",
  "Architecture",
  "Infrastructure",
  "Monitoring",
  "Observability",
  "Reliability",
  "Scalability",
  "Performance",
  "Optimization",
  "Automation",
  "Integration",
  "Deployment",
  "Production",
  "Cross-functional",
  "Stakeholder",
  "Roadmap",
  "Mentoring",
  "Documentation",
];

const BUZZWORD_PATTERNS = [
  /\b(end[- ]to[- ]end|full[- ]stack|hands[- ]on|data[- ]driven|customer[- ]facing|user[- ]centric|cloud[- ]native|best[- ]in[- ]class|best practices|high[- ]impact|fast[- ]paced|detail[- ]oriented|self[- ]starter|cross[- ]functional|stakeholder management|technical leadership|problem solving|code quality|continuous improvement)\b/gi,
];

const REQUIREMENT_PATTERNS = [
  /(?:experience with|proficiency in|knowledge of|familiar(?:ity)? with|expertise in|skilled in|strong (?:background|experience) in)\s+([^,.\n;]+)/gi,
  /(?:required|must have|requirements?|qualifications?|preferred|nice to have)[:\s-]+([^.\n]+)/gi,
  /(?:using|work with|build(?:ing)? with)\s+([^,.\n;]+)/gi,
];

function normalizeKeyword(raw: string): string | null {
  const cleaned = raw
    .replace(/^[\s•\-*]+/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 2 || cleaned.length > 48) return null;
  if (/^\d/.test(cleaned)) return null;
  if (/^(and|or|the|a|an|to|for|with|in|on|at|of)$/i.test(cleaned)) return null;

  return cleaned
    .split(" ")
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      if (/^[A-Z0-9.+#/-]+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function addKeyword(set: Set<string>, raw: string) {
  const keyword = normalizeKeyword(raw);
  if (!keyword) return;
  const key = keyword.toLowerCase();
  for (const existing of set) {
    if (existing.toLowerCase() === key) return;
  }
  set.add(keyword);
}

function collectKeywordsFromText(text: string, keywords: Set<string>) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const lower = trimmed.toLowerCase();

  for (const term of KNOWN_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      addKeyword(keywords, term);
    }
  }

  for (const pattern of REQUIREMENT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(trimmed)) !== null) {
      const segment = match[1];
      for (const part of segment.split(/[,/|&+]/)) {
        addKeyword(keywords, part);
      }
    }
  }

  for (const pattern of BUZZWORD_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(trimmed)) !== null) {
      addKeyword(keywords, match[0]);
    }
  }

  for (const line of trimmed.split("\n")) {
    const lineTrimmed = line.trim();
    if (!/^[\s•\-*\d.)]+/.test(lineTrimmed)) continue;
    const body = lineTrimmed.replace(/^[\s•\-*\d.)]+/, "");
    for (const part of body.split(/[,/|&+]/)) {
      addKeyword(keywords, part);
    }
  }

  const titleCasePhrases = trimmed.match(
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g,
  );
  if (titleCasePhrases) {
    for (const phrase of titleCasePhrases) {
      if (phrase.length <= 40) addKeyword(keywords, phrase);
    }
  }
}

export function extractJobKeywords(description: string): string[] {
  const keywords = new Set<string>();
  collectKeywordsFromText(description, keywords);
  return [...keywords].slice(0, 45);
}

export function extractKeywordsForJob(job: JobKeywordSource): string[] {
  const keywords = new Set<string>();
  const jobDesc = job.jobDesc || job.description || "";
  const position = job.position || job.title || "";
  collectKeywordsFromText(jobDesc, keywords);
  if (position.trim()) {
    collectKeywordsFromText(position, keywords);
  }
  if (job.company?.trim()) {
    addKeyword(keywords, job.company);
  }
  return [...keywords].slice(0, 50);
}

function normalizeSkillToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9+#/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function profileSkillMatchesKeyword(
  skill: string,
  keyword: string,
): boolean {
  const skillNorm = normalizeSkillToken(skill);
  const keywordNorm = normalizeSkillToken(keyword);
  if (!skillNorm || !keywordNorm) return false;
  if (skillNorm === keywordNorm) return true;
  if (skillNorm.includes(keywordNorm) || keywordNorm.includes(skillNorm)) {
    return true;
  }

  const skillParts = skillNorm.split(" ");
  const keywordParts = keywordNorm.split(" ");
  return keywordParts.every(
    (part) => part.length > 2 && skillParts.some((sp) => sp.includes(part) || part.includes(sp)),
  );
}

export function findMatchingProfileSkills(
  profileSkills: string[],
  keyword: string,
): string[] {
  return profileSkills.filter((skill) => profileSkillMatchesKeyword(skill, keyword));
}

/** Hand-pick and order skills: JD-aligned profile skills first, then AI picks, then the rest. */
export function curateTailoredSkills(
  profileSkills: string[],
  aiSkills: string[],
  jobKeywords: string[],
): string[] {
  const curated: string[] = [];
  const seen = new Set<string>();

  const add = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const key = normalizeSkillToken(trimmed);
    if (!key || seen.has(key)) return;
    seen.add(key);
    curated.push(trimmed);
  };

  for (const keyword of jobKeywords) {
    const matches = findMatchingProfileSkills(profileSkills, keyword);
    if (matches.length > 0) {
      add(keyword);
    }
  }

  for (const skill of aiSkills) {
    if (profileSkills.some((profileSkill) => profileSkillMatchesKeyword(profileSkill, skill))) {
      add(skill);
    }
  }

  for (const skill of profileSkills) {
    add(skill);
  }

  return curated.slice(0, 28);
}

export function buildSkillCurationHints(
  profileSkills: string[],
  jobKeywords: string[],
): { mustInclude: string[]; jdTermsToMirror: string[] } {
  const mustInclude: string[] = [];
  const jdTermsToMirror: string[] = [];

  for (const keyword of jobKeywords) {
    const matches = findMatchingProfileSkills(profileSkills, keyword);
    if (matches.length > 0) {
      mustInclude.push(`${keyword} (profile: ${matches.join(", ")})`);
      jdTermsToMirror.push(keyword);
    }
  }

  return {
    mustInclude: mustInclude.slice(0, 20),
    jdTermsToMirror: jdTermsToMirror.slice(0, 25),
  };
}

export function resumeContainsKeyword(
  resumeText: string,
  keyword: string,
): boolean {
  const haystack = resumeText.toLowerCase();
  const needle = keyword.toLowerCase();

  if (haystack.includes(needle)) return true;

  const alt = needle.replace(/\.js$/i, "");
  if (alt !== needle && haystack.includes(alt)) return true;

  return needle.split(/\s+/).every((part) => part.length > 2 && haystack.includes(part));
}

export function computeKeywordCoverage(
  resumeText: string,
  jobKeywords: string[],
): { matchedKeywords: string[]; missingKeywords: string[]; matchScore: number } {
  if (jobKeywords.length === 0) {
    return { matchedKeywords: [], missingKeywords: [], matchScore: 0 };
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of jobKeywords) {
    if (resumeContainsKeyword(resumeText, keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const matchScore = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
  return { matchedKeywords, missingKeywords, matchScore };
}

export function resumeDocumentToSearchText(resume: {
  summary?: string;
  skills?: string[];
  experience?: { title: string; company: string; bullets: string[] }[];
  projects?: { title: string; description?: string; bullets?: string[] }[];
  education?: { degree: string; school: string; details?: string }[];
}): string {
  const parts: string[] = [];

  if (resume.summary) parts.push(resume.summary);
  if (resume.skills?.length) parts.push(resume.skills.join(" "));

  for (const entry of resume.experience ?? []) {
    parts.push(entry.title, entry.company, ...entry.bullets);
  }

  for (const project of resume.projects ?? []) {
    parts.push(project.title);
    if (project.description) parts.push(project.description);
    if (project.bullets?.length) parts.push(...project.bullets);
  }

  for (const entry of resume.education ?? []) {
    parts.push(entry.degree, entry.school);
    if (entry.details) parts.push(entry.details);
  }

  return parts.join(" ");
}
