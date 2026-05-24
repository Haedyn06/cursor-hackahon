/**
 * Heuristic extraction of ATS-relevant keywords from a job description.
 * Used to steer resume generation and to score keyword coverage post-generation.
 */

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

export function extractJobKeywords(description: string): string[] {
  const keywords = new Set<string>();
  const text = description.trim();
  if (!text) return [];

  const lower = text.toLowerCase();

  for (const term of KNOWN_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      addKeyword(keywords, term);
    }
  }

  for (const pattern of REQUIREMENT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const segment = match[1];
      for (const part of segment.split(/[,/|&+]/)) {
        addKeyword(keywords, part);
      }
    }
  }

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!/^[\s•\-*\d.)]+/.test(trimmed)) continue;
    const body = trimmed.replace(/^[\s•\-*\d.)]+/, "");
    for (const part of body.split(/[,/|&+]/)) {
      addKeyword(keywords, part);
    }
  }

  const titleCasePhrases = text.match(
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
  );
  if (titleCasePhrases) {
    for (const phrase of titleCasePhrases) {
      if (phrase.length <= 40) addKeyword(keywords, phrase);
    }
  }

  return [...keywords].slice(0, 35);
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
