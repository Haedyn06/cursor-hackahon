import type { OnboardingProfileState } from "@/lib/onboarding-storage";
import type { AutofillProfilePayload } from "@/lib/ai/profile-autofill-generation";

export function mapAutofillToOnboardingProfile(
  payload: AutofillProfilePayload,
): OnboardingProfileState {
  let nextId = Date.now();
  const id = () => nextId++;

  return {
    name: payload.name,
    location: payload.location,
    email: payload.email,
    phone: payload.phone,
    targetRole: payload.targetRole,
    experience: payload.experience,
    about: payload.about,
    skills: payload.skills,
    links:
      payload.links.length > 0
        ? payload.links.map((link) => ({
            id: id(),
            name: link.name,
            url: link.url,
          }))
        : [{ id: id(), name: "", url: "" }],
    languages:
      payload.languages.length > 0
        ? payload.languages.map((language) => ({
            id: id(),
            name: language.name,
            level: language.level,
          }))
        : [{ id: id(), name: "", level: "Conversational" }],
    certifications:
      payload.certifications.length > 0
        ? payload.certifications.map((cert) => ({
            id: id(),
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date,
          }))
        : [{ id: id(), name: "", issuer: "", date: "" }],
    experience_entries:
      payload.experience_entries.length > 0
        ? payload.experience_entries.map((entry) => ({
            id: id(),
            title: entry.title,
            company: entry.company,
            dates: entry.dates,
            bullets: entry.bullets,
          }))
        : [{ id: id(), title: "", company: "", dates: "", bullets: "" }],
  };
}
