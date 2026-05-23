import type { ResumeContent } from "@/lib/types";

export function ResumePreview({ resume }: { resume: ResumeContent }) {
  return (
    <article className="resume-ats bg-white p-8 text-[11px] leading-snug text-neo-ink print:p-6">
      <header className="border-b border-neo-ink/30 pb-3 text-center">
        <h1 className="text-lg font-bold tracking-wide">{resume.name}</h1>
        <p className="mt-1 text-[10px]">
          {resume.email} · {resume.phone} · {resume.location}
        </p>
      </header>

      <section className="mt-4">
        <h2 className="border-b border-neo-ink/40 pb-0.5 text-xs font-bold uppercase tracking-widest">
          Summary
        </h2>
        <p className="mt-1.5">{resume.summary}</p>
      </section>

      <section className="mt-4">
        <h2 className="border-b border-neo-ink/40 pb-0.5 text-xs font-bold uppercase tracking-widest">
          Experience
        </h2>
        {resume.experience.map((exp, i) => (
          <div key={i} className="mt-2">
            <div className="flex flex-wrap justify-between gap-1 font-bold">
              <span>
                {exp.title} — {exp.company}
              </span>
              <span className="text-[10px] font-normal italic">{exp.dates}</span>
            </div>
            <ul className="mt-1 list-disc pl-4">
              {exp.bullets.map((b, j) => (
                <li key={j} className="mt-0.5">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {resume.projects && resume.projects.length > 0 && (
        <section className="mt-4">
          <h2 className="border-b border-neo-ink/40 pb-0.5 text-xs font-bold uppercase tracking-widest">
            Projects
          </h2>
          {resume.projects.map((p, i) => (
            <div key={i} className="mt-2">
              <p className="font-bold">{p.name}</p>
              <ul className="mt-1 list-disc pl-4">
                {p.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="mt-4">
        <h2 className="border-b border-neo-ink/40 pb-0.5 text-xs font-bold uppercase tracking-widest">
          Education
        </h2>
        {resume.education.map((ed, i) => (
          <div key={i} className="mt-2 flex justify-between gap-2">
            <span className="font-bold">
              {ed.degree}, {ed.school}
            </span>
            <span className="italic">{ed.dates}</span>
          </div>
        ))}
      </section>

      <section className="mt-4">
        <h2 className="border-b border-neo-ink/40 pb-0.5 text-xs font-bold uppercase tracking-widest">
          Skills
        </h2>
        <p className="mt-1.5">{resume.skills.join(" · ")}</p>
      </section>
    </article>
  );
}
