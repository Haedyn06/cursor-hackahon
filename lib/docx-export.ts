import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
  type ISectionOptions,
} from "docx";
import type { ResumeDocument } from "@/lib/resume-document";

const FONT = "Arial";
const BODY_SIZE = 22; // 11pt
const NAME_SIZE = 44; // 22pt
const CONTACT_SIZE = 20; // 10pt
const SECTION_SIZE = 22; // 11pt
const MUTED = "555555";

function body(text: string, options?: { bold?: boolean; color?: string }) {
  return new TextRun({
    text,
    font: FONT,
    size: BODY_SIZE,
    bold: options?.bold,
    color: options?.color,
  });
}

function sectionHeading(title: string) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: {
        color: "222222",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        font: FONT,
        size: SECTION_SIZE,
        bold: true,
      }),
    ],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    numbering: { reference: "resume-bullets", level: 0 },
    spacing: { after: 40 },
    children: [body(text)],
  });
}

function buildDocxChildren(resume: ResumeDocument): Paragraph[] {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: resume.name,
          font: FONT,
          size: NAME_SIZE,
          bold: true,
          allCaps: true,
        }),
      ],
    }),
  ];

  if (resume.contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [body(resume.contactLine, { color: MUTED })],
      }),
    );
  }

  if (resume.summary) {
    children.push(
      sectionHeading("Summary"),
      new Paragraph({
        spacing: { after: 120 },
        children: [body(resume.summary)],
      }),
    );
  }

  if (resume.experience.length > 0) {
    children.push(sectionHeading("Experience"));

    for (const role of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            body(`${role.title}${role.company ? ` — ${role.company}` : ""}`, {
              bold: true,
            }),
            body("\t"),
            ...(role.dates ? [body(role.dates, { color: MUTED })] : []),
          ],
        }),
      );

      for (const bullet of role.bullets) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (resume.projects && resume.projects.length > 0) {
    children.push(sectionHeading("Projects"));

    for (const project of resume.projects) {
      const header = project.url
        ? `${project.title} — ${project.url}`
        : project.title;

      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [body(header, { bold: true })],
        }),
      );

      if (project.description) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [body(project.description)],
          }),
        );
      }

      for (const bullet of project.bullets ?? []) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (resume.education && resume.education.length > 0) {
    children.push(sectionHeading("Education"));

    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            body(`${edu.degree}${edu.school ? `, ${edu.school}` : ""}`, {
              bold: true,
            }),
            ...(edu.details ? [body(` · ${edu.details}`, { color: MUTED })] : []),
            body("\t"),
            ...(edu.dates ? [body(edu.dates, { color: MUTED })] : []),
          ],
        }),
      );
    }
  }

  if (resume.skills && resume.skills.length > 0) {
    children.push(
      sectionHeading("Skills"),
      new Paragraph({
        spacing: { after: 120 },
        children: [body(resume.skills.join(" · "))],
      }),
    );
  }

  if (resume.certifications && resume.certifications.length > 0) {
    children.push(sectionHeading("Certifications"));

    for (const cert of resume.certifications) {
      const line = [cert.name, cert.issuer, cert.date ? `(${cert.date})` : ""]
        .filter(Boolean)
        .join(" — ");

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [body(line)],
        }),
      );
    }
  }

  return children;
}

export function buildDocxDocument(resume: ResumeDocument) {
  const section: ISectionOptions = {
    properties: {
      page: {
        margin: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720,
        },
      },
    },
    children: buildDocxChildren(resume),
  };

  return new Document({
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [section],
  });
}

export async function exportResumeToDocx(resume: ResumeDocument) {
  return Packer.toBlob(buildDocxDocument(resume));
}
