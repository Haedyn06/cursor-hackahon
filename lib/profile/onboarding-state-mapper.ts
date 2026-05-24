import type { MockProfile } from "@/lib/mock-data";
import {
  getInitialProfile,
  toProfileLibraryItems,
  type StoredProfile,
} from "@/lib/onboarding-storage";

type OnboardingLink = { name: string; url: string; position: number };
type OnboardingSkill = { name: string; position: number };
type OnboardingLanguage = { name: string; level: string; position: number };
type OnboardingCertification = {
  name: string;
  issuer: string;
  date: string;
  position: number;
};
type OnboardingExperience = {
  title: string;
  company: string;
  dates: string;
  bullets: string;
  position: number;
};
type OnboardingProject = {
  title: string;
  url: string;
  desc: string;
  active: boolean;
  position: number;
};
type OnboardingEducation = {
  degree: string;
  school: string;
  dates: string;
  gpa: string;
  position: number;
};
type OnboardingImportedResume = {
  fileName: string;
  displayName: string;
};

export type OnboardingStateSnapshot = {
  profile: {
    fullName: string;
    location: string;
    email: string;
    phone?: string;
    targetRole: string;
    experienceLevel: string;
    about: string;
  } | null;
  links?: OnboardingLink[];
  skills?: OnboardingSkill[];
  languages?: OnboardingLanguage[];
  certifications?: OnboardingCertification[];
  experienceEntries?: OnboardingExperience[];
  projects?: OnboardingProject[];
  education?: OnboardingEducation[];
  importedResumes?: OnboardingImportedResume[];
};

export function mapOnboardingStateToStoredProfile(
  state: OnboardingStateSnapshot | null | undefined,
): StoredProfile {
  const fallback = getInitialProfile();

  if (!state?.profile) {
    return fallback;
  }

  return {
    ...fallback,
    name: state.profile.fullName || fallback.name,
    location: state.profile.location || fallback.location,
    email: state.profile.email || fallback.email,
    phone: state.profile.phone ?? fallback.phone,
    targetRole: state.profile.targetRole || fallback.targetRole,
    experience: state.profile.experienceLevel || fallback.experience,
    about: state.profile.about || fallback.about,
    links:
      (state.links ?? []).length > 0
        ? [...(state.links ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((link, index) => ({
              id: index + 1,
              name: link.name,
              url: link.url,
            }))
        : fallback.links,
    skills:
      (state.skills ?? []).length > 0
        ? [...(state.skills ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((skill) => skill.name)
        : fallback.skills,
    languages:
      (state.languages ?? []).length > 0
        ? [...(state.languages ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((language, index) => ({
              id: index + 1,
              name: language.name,
              level: language.level,
            }))
        : fallback.languages,
    certifications:
      (state.certifications ?? []).length > 0
        ? [...(state.certifications ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((certification, index) => ({
              id: index + 1,
              name: certification.name,
              issuer: certification.issuer,
              date: certification.date,
            }))
        : fallback.certifications,
    experience_entries:
      (state.experienceEntries ?? []).length > 0
        ? [...(state.experienceEntries ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((entry, index) => ({
              id: index + 1,
              title: entry.title,
              company: entry.company,
              dates: entry.dates,
              bullets: entry.bullets
                .split("\n")
                .map((line, bulletIndex) => ({
                  id: bulletIndex + 1,
                  text: line.replace(/^[-•*]\s*/, "").trim(),
                  active: true,
                }))
                .filter((bullet) => bullet.text),
            }))
        : fallback.experience_entries,
    projects:
      (state.projects ?? []).length > 0
        ? [...(state.projects ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((project, index) => ({
              id: index + 1,
              title: project.title,
              url: project.url,
              desc: project.desc,
              active: project.active,
            }))
        : fallback.projects,
    education:
      (state.education ?? []).length > 0
        ? [...(state.education ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((entry, index) => ({
              id: index + 1,
              degree: entry.degree,
              school: entry.school,
              dates: entry.dates,
              gpa: entry.gpa,
            }))
        : fallback.education,
    resumeLibrary: toProfileLibraryItems(
      (state.importedResumes ?? []).map((resume, index) => ({
        id: index + 1,
        file: resume.fileName,
        aiName: resume.displayName,
        naming: false,
      })),
      fallback.resumeLibrary ?? [],
    ),
  };
}

export function mapOnboardingStateToMockProfile(
  state: OnboardingStateSnapshot | null | undefined,
): MockProfile {
  return mapOnboardingStateToStoredProfile(state) as MockProfile;
}
