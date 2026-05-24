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
import type { ProfileExportDocument } from "@/lib/profile-export-document";

const FONT = "Arial";
const BODY_SIZE = 22;
const NAME_SIZE = 44;
const SECTION_SIZE = 22;
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
    numbering: { reference: "profile-bullets", level: 0 },
    spacing: { after: 40 },
    children: [body(text)],
  });
}

function buildDocxChildren(document: ProfileExportDocument): Paragraph[] {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: document.name,
          font: FONT,
          size: NAME_SIZE,
          bold: true,
          allCaps: true,
        }),
      ],
    }),
  ];

  if (document.contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [body(document.contactLine, { color: MUTED })],
      }),
    );
  }

  if (document.targetRole || document.experienceLevel) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          body(
            [document.targetRole, document.experienceLevel].filter(Boolean).join(" · "),
            { bold: true },
          ),
        ],
      }),
    );
  }

  if (document.summary) {
    children.push(
      sectionHeading("Professional Summary"),
      new Paragraph({
        spacing: { after: 120 },
        children: [body(document.summary)],
      }),
    );
  }

  if (document.links.length > 0) {
    children.push(sectionHeading("Links"));
    for (const link of document.links) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [body(`${link.name}: ${link.url}`)],
        }),
      );
    }
  }

  if (document.experience.length > 0) {
    children.push(sectionHeading("Work Experience"));
    for (const role of document.experience) {
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

  if (document.projects.length > 0) {
    children.push(sectionHeading("Projects"));
    for (const project of document.projects) {
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

  if (document.skills.length > 0) {
    children.push(
      sectionHeading("Skills"),
      new Paragraph({
        spacing: { after: 120 },
        children: [body(document.skills.join(" · "))],
      }),
    );
  }

  if (document.languages.length > 0) {
    children.push(sectionHeading("Languages"));
    for (const language of document.languages) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [body(`${language.name} — ${language.level}`)],
        }),
      );
    }
  }

  if (document.certifications.length > 0) {
    children.push(sectionHeading("Certifications"));
    for (const cert of document.certifications) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            body([cert.name, cert.issuer, cert.date].filter(Boolean).join(" — ")),
          ],
        }),
      );
    }
  }

  if (document.education.length > 0) {
    children.push(sectionHeading("Education"));
    for (const edu of document.education) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            body(`${edu.degree}${edu.school ? `, ${edu.school}` : ""}`, { bold: true }),
            ...(edu.dates ? [body(` (${edu.dates})`, { color: MUTED })] : []),
          ],
        }),
      );
      if (edu.details) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [body(edu.details, { color: MUTED })],
          }),
        );
      }
    }
  }

  if (document.resumeLibrary.length > 0) {
    children.push(sectionHeading("Resume Library"));
    for (const entry of document.resumeLibrary) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [body(`${entry.label} — ${entry.job} (${entry.date})`)],
        }),
      );
    }
  }

  return children;
}

export async function exportProfileToDocx(document: ProfileExportDocument) {
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
    children: buildDocxChildren(document),
  };

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "profile-bullets",
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

  return Packer.toBlob(doc);
}
