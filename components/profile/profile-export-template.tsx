"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { ProfileExportDocument } from "@/lib/profile-export-document";

type ProfileExportTemplateProps = {
  document: ProfileExportDocument;
  className?: string;
  variant?: "screen" | "print";
};

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      style={{
        margin: "14px 0 6px",
        paddingBottom: "3px",
        borderBottom: "1.5px solid #222222",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#111111",
      }}
    >
      {children}
    </h2>
  );
}

export const ProfileExportTemplate = forwardRef<
  HTMLDivElement,
  ProfileExportTemplateProps
>(function ProfileExportTemplate({ document, className, variant = "screen" }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        variant === "screen" &&
          "mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5",
        className,
      )}
      style={{
        width: "8.5in",
        minHeight: "11in",
        maxWidth: "100%",
        background: "#ffffff",
        color: "#111111",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: "10.5pt",
        lineHeight: 1.45,
        padding: "0.55in 0.65in",
        boxSizing: "border-box",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "14px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "22pt",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1.15,
          }}
        >
          {document.name}
        </h1>
        {document.contactLine ? (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "9.5pt",
              color: "#444444",
              lineHeight: 1.5,
            }}
          >
            {document.contactLine}
          </p>
        ) : null}
        {document.targetRole || document.experienceLevel ? (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "10pt",
              color: "#222222",
              fontWeight: 600,
            }}
          >
            {[document.targetRole, document.experienceLevel]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </header>

      {document.summary ? (
        <section>
          <SectionTitle>Professional Summary</SectionTitle>
          <p style={{ margin: 0 }}>{document.summary}</p>
        </section>
      ) : null}

      {document.links.length > 0 ? (
        <section>
          <SectionTitle>Links</SectionTitle>
          {document.links.map((link) => (
            <p key={`${link.name}-${link.url}`} style={{ margin: "0 0 4px" }}>
              <strong>{link.name}:</strong> {link.url}
            </p>
          ))}
        </section>
      ) : null}

      {document.experience.length > 0 ? (
        <section>
          <SectionTitle>Work Experience</SectionTitle>
          {document.experience.map((role) => (
            <div key={`${role.title}-${role.company}-${role.dates}`} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <strong>
                  {role.title}
                  {role.company ? ` — ${role.company}` : ""}
                </strong>
                <span style={{ color: "#555555", whiteSpace: "nowrap" }}>{role.dates}</span>
              </div>
              <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                {role.bullets.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: "2px" }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {document.projects.length > 0 ? (
        <section>
          <SectionTitle>Projects</SectionTitle>
          {document.projects.map((project) => (
            <div key={project.title} style={{ marginBottom: "10px" }}>
              <strong>
                {project.title}
                {project.url ? ` — ${project.url}` : ""}
              </strong>
              {project.description ? (
                <p style={{ margin: "4px 0 0" }}>{project.description}</p>
              ) : null}
              {(project.bullets ?? []).length > 0 ? (
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  {(project.bullets ?? []).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {document.skills.length > 0 ? (
        <section>
          <SectionTitle>Skills</SectionTitle>
          <p style={{ margin: 0 }}>{document.skills.join(" · ")}</p>
        </section>
      ) : null}

      {document.languages.length > 0 ? (
        <section>
          <SectionTitle>Languages</SectionTitle>
          {document.languages.map((language) => (
            <p key={language.name} style={{ margin: "0 0 4px" }}>
              {language.name} — {language.level}
            </p>
          ))}
        </section>
      ) : null}

      {document.certifications.length > 0 ? (
        <section>
          <SectionTitle>Certifications</SectionTitle>
          {document.certifications.map((cert) => (
            <p key={cert.name} style={{ margin: "0 0 4px" }}>
              {[cert.name, cert.issuer, cert.date].filter(Boolean).join(" — ")}
            </p>
          ))}
        </section>
      ) : null}

      {document.education.length > 0 ? (
        <section>
          <SectionTitle>Education</SectionTitle>
          {document.education.map((edu) => (
            <div key={`${edu.degree}-${edu.school}`} style={{ marginBottom: "8px" }}>
              <strong>
                {edu.degree}
                {edu.school ? `, ${edu.school}` : ""}
              </strong>
              {edu.dates ? (
                <span style={{ color: "#555555" }}> ({edu.dates})</span>
              ) : null}
              {edu.details ? (
                <p style={{ margin: "2px 0 0", color: "#555555" }}>{edu.details}</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {document.resumeLibrary.length > 0 ? (
        <section>
          <SectionTitle>Resume Library</SectionTitle>
          {document.resumeLibrary.map((entry) => (
            <p key={entry.label} style={{ margin: "0 0 4px" }}>
              {entry.label} — {entry.job} ({entry.date})
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
});
