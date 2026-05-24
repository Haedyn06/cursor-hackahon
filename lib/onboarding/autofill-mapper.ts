import type { OnboardingProfileState } from "@/lib/onboarding-storage";
import type { AutofillProfilePayload } from "@/lib/ai/profile-autofill-generation";

export function mapAutofillToOnboardingProfile(
  payload: AutofillProfilePayload,
): OnboardingProfileState {
  let nextId = Date.now();
  const id = () => nextId++;

  const links = payload.links ?? [];
  const languages = payload.languages ?? [];
  const certifications = payload.certifications ?? [];
  const experienceEntries = payload.experience_entries ?? [];
  const education = payload.education ?? [];

  return {
    name: payload.name,
    location: payload.location,
    email: payload.email,
    phone: payload.phone,
    targetRole: payload.targetRole,
    experience: payload.experience,
    about: payload.about,
    skills: payload.skills ?? [],
    links:
      links.length > 0
        ? links.map((link) => ({
            id: id(),
            name: link.name,
            url: link.url,
          }))
        : [{ id: id(), name: "", url: "" }],
    languages:
      languages.length > 0
        ? languages.map((language) => ({
            id: id(),
            name: language.name,
            level: language.level,
          }))
        : [{ id: id(), name: "", level: "Conversational" }],
    certifications:
      certifications.length > 0
        ? certifications.map((cert) => ({
            id: id(),
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date,
          }))
        : [{ id: id(), name: "", issuer: "", date: "" }],
    experience_entries:
      experienceEntries.length > 0
        ? experienceEntries.map((entry) => ({
            id: id(),
            title: entry.title,
            company: entry.company,
            dates: entry.dates,
            bullets: entry.bullets,
          }))
        : [{ id: id(), title: "", company: "", dates: "", bullets: "" }],
    projects: [],
    education:
      education.length > 0
        ? education.map((entry) => ({
            id: id(),
            degree: entry.degree,
            school: entry.school,
            dates: entry.dates,
            gpa: entry.gpa,
          }))
        : [],
  };
}
