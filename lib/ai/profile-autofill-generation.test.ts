import test from "node:test";
import assert from "node:assert/strict";
import { parseProfileAutofillResponse } from "@/lib/ai/profile-autofill-generation";
import { mapAutofillToOnboardingProfile } from "@/lib/onboarding/autofill-mapper";

test("autofill parser and mapper preserve education entries", () => {
  const payload = parseProfileAutofillResponse(`{
    "name": "Ada Lovelace",
    "location": "London",
    "email": "ada@example.com",
    "phone": "",
    "links": [],
    "targetRole": "Software Engineer",
    "experience": "Mid Level (2-5 yrs)",
    "about": "",
    "skills": ["TypeScript"],
    "languages": [],
    "certifications": [],
    "experience_entries": [],
    "education": [
      {
        "degree": "B.S. Computer Science",
        "school": "University of London",
        "dates": "2018 - 2022",
        "gpa": "3.9"
      }
    ]
  }`);

  assert.equal(payload.education.length, 1);
  assert.deepEqual(payload.education[0], {
    degree: "B.S. Computer Science",
    school: "University of London",
    dates: "2018 - 2022",
    gpa: "3.9",
  });

  const profile = mapAutofillToOnboardingProfile(payload);
  assert.equal(profile.education.length, 1);
  assert.equal(profile.education[0].degree, "B.S. Computer Science");
  assert.equal(profile.education[0].school, "University of London");
  assert.equal(profile.education[0].dates, "2018 - 2022");
  assert.equal(profile.education[0].gpa, "3.9");
});
