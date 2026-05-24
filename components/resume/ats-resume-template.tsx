"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { ResumeDocument } from "@/lib/resume-document";

type AtsResumeTemplateProps = {
  document: ResumeDocument;
  className?: string;
  /** screen = in-app preview with paper shadow; print = flat export target */
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

export const AtsResumeTemplate = forwardRef<HTMLDivElement, AtsResumeTemplateProps>(
  function AtsResumeTemplate({ document, className, variant = "screen" }, ref) {
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
        </header>

        {document.summary ? (
          <section>
            <SectionTitle>Summary</SectionTitle>
            <p style={{ margin: 0, color: "#222222" }}>{document.summary}</p>
          </section>
        ) : null}

        {document.experience.length > 0 ? (
          <section>
            <SectionTitle>Experience</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {document.experience.map((role, index) => (
                <div key={`${role.title}-${index}`}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "baseline",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "10.5pt" }}>
                      {role.title}
                      {role.company ? (
                        <span style={{ fontWeight: 500 }}>{` — ${role.company}`}</span>
                      ) : null}
                    </div>
                    {role.dates ? (
                      <div
                        style={{
                          flexShrink: 0,
                          fontSize: "9.5pt",
                          color: "#555555",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {role.dates}
                      </div>
                    ) : null}
                  </div>
                  {role.bullets.length > 0 ? (
                    <ul
                      style={{
                        margin: "4px 0 0",
                        paddingLeft: "18px",
                        listStyleType: "disc",
                      }}
                    >
                      {role.bullets.map((bullet, bulletIndex) => (
                        <li
                          key={bulletIndex}
                          style={{ marginBottom: "2px", color: "#222222" }}
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {document.projects && document.projects.length > 0 ? (
          <section>
            <SectionTitle>Projects</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {document.projects.map((project, index) => (
                <div key={`${project.title}-${index}`}>
                  <div style={{ fontWeight: 700 }}>
                    {project.title}
                    {project.url ? (
                      <span style={{ fontWeight: 500, color: "#333333" }}>
                        {` — ${project.url}`}
                      </span>
                    ) : null}
                  </div>
                  {project.description ? (
                    <p style={{ margin: "2px 0 0", color: "#222222" }}>
                      {project.description}
                    </p>
                  ) : null}
                  {project.bullets && project.bullets.length > 0 ? (
                    <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                      {project.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {document.education && document.education.length > 0 ? (
          <section>
            <SectionTitle>Education</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {document.education.map((edu, index) => (
                <div
                  key={`${edu.degree}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700 }}>{edu.degree}</span>
                    {edu.school ? (
                      <span>{`, ${edu.school}`}</span>
                    ) : null}
                    {edu.details ? (
                      <span style={{ color: "#555555" }}>{` · ${edu.details}`}</span>
                    ) : null}
                  </div>
                  {edu.dates ? (
                    <div style={{ flexShrink: 0, color: "#555555", fontSize: "9.5pt" }}>
                      {edu.dates}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {document.skills && document.skills.length > 0 ? (
          <section>
            <SectionTitle>Skills</SectionTitle>
            <p style={{ margin: 0 }}>{document.skills.join(" · ")}</p>
          </section>
        ) : null}

        {document.certifications && document.certifications.length > 0 ? (
          <section>
            <SectionTitle>Certifications</SectionTitle>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {document.certifications.map((cert, index) => (
                <li key={`${cert.name}-${index}`}>
                  {cert.name}
                  {cert.issuer ? ` — ${cert.issuer}` : ""}
                  {cert.date ? ` (${cert.date})` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  },
);
