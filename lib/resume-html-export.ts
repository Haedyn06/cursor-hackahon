import type { ResumeDocument } from "@/lib/resume-document";

function applyStyles(element: HTMLElement, styles: Record<string, string>) {
  Object.assign(element.style, styles);
}

function createSectionTitle(title: string) {
  const heading = document.createElement("h2");
  heading.textContent = title;
  applyStyles(heading, {
    margin: "14px 0 6px",
    paddingBottom: "3px",
    borderBottom: "1.5px solid #222222",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#111111",
  });
  return heading;
}

function createSection(title: string) {
  const section = document.createElement("section");
  section.appendChild(createSectionTitle(title));
  return section;
}

export function resumeDocumentToExportElement(resume: ResumeDocument): HTMLElement {
  const root = document.createElement("div");
  applyStyles(root, {
    width: "8.5in",
    minHeight: "11in",
    maxWidth: "100%",
    background: "#ffffff",
    color: "#111111",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: "10.5pt",
    lineHeight: "1.45",
    padding: "0.55in 0.65in",
    boxSizing: "border-box",
  });

  const header = document.createElement("header");
  applyStyles(header, { textAlign: "center", marginBottom: "14px" });

  const name = document.createElement("h1");
  name.textContent = resume.name?.trim() || "Resume";
  applyStyles(name, {
    margin: "0",
    fontSize: "22pt",
    fontWeight: "700",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: "1.15",
  });
  header.appendChild(name);

  if (resume.contactLine?.trim()) {
    const contact = document.createElement("p");
    contact.textContent = resume.contactLine.trim();
    applyStyles(contact, {
      margin: "8px 0 0",
      fontSize: "9.5pt",
      color: "#444444",
      lineHeight: "1.5",
    });
    header.appendChild(contact);
  }

  root.appendChild(header);

  if (resume.summary?.trim()) {
    const section = createSection("Summary");
    const paragraph = document.createElement("p");
    paragraph.textContent = resume.summary.trim();
    applyStyles(paragraph, { margin: "0", color: "#222222" });
    section.appendChild(paragraph);
    root.appendChild(section);
  }

  const experience = resume.experience ?? [];
  if (experience.length > 0) {
    const section = createSection("Experience");
    const list = document.createElement("div");
    applyStyles(list, { display: "flex", flexDirection: "column", gap: "10px" });

    for (const role of experience) {
      const item = document.createElement("div");
      const row = document.createElement("div");
      applyStyles(row, {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        alignItems: "baseline",
      });

      const titleWrap = document.createElement("div");
      applyStyles(titleWrap, { fontWeight: "700", fontSize: "10.5pt" });
      titleWrap.textContent = role.title;
      if (role.company) {
        const company = document.createElement("span");
        applyStyles(company, { fontWeight: "500" });
        company.textContent = ` — ${role.company}`;
        titleWrap.appendChild(company);
      }
      row.appendChild(titleWrap);

      if (role.dates) {
        const dates = document.createElement("div");
        dates.textContent = role.dates;
        applyStyles(dates, {
          flexShrink: "0",
          fontSize: "9.5pt",
          color: "#555555",
          whiteSpace: "nowrap",
        });
        row.appendChild(dates);
      }

      item.appendChild(row);

      if ((role.bullets ?? []).length > 0) {
        const bullets = document.createElement("ul");
        applyStyles(bullets, {
          margin: "4px 0 0",
          paddingLeft: "18px",
          listStyleType: "disc",
        });
        for (const bullet of role.bullets ?? []) {
          const li = document.createElement("li");
          li.textContent = bullet;
          applyStyles(li, { marginBottom: "2px", color: "#222222" });
          bullets.appendChild(li);
        }
        item.appendChild(bullets);
      }

      list.appendChild(item);
    }

    section.appendChild(list);
    root.appendChild(section);
  }

  if (resume.education && resume.education.length > 0) {
    const section = createSection("Education");
    const list = document.createElement("div");
    applyStyles(list, { display: "flex", flexDirection: "column", gap: "6px" });

    for (const edu of resume.education) {
      const row = document.createElement("div");
      applyStyles(row, {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        alignItems: "baseline",
      });

      const details = document.createElement("div");
      const degree = document.createElement("span");
      applyStyles(degree, { fontWeight: "700" });
      degree.textContent = edu.degree;
      details.appendChild(degree);
      if (edu.school) {
        details.appendChild(document.createTextNode(`, ${edu.school}`));
      }
      if (edu.details) {
        const extra = document.createElement("span");
        applyStyles(extra, { color: "#555555" });
        extra.textContent = ` · ${edu.details}`;
        details.appendChild(extra);
      }
      row.appendChild(details);

      if (edu.dates) {
        const dates = document.createElement("div");
        dates.textContent = edu.dates;
        applyStyles(dates, {
          flexShrink: "0",
          color: "#555555",
          fontSize: "9.5pt",
        });
        row.appendChild(dates);
      }

      list.appendChild(row);
    }

    section.appendChild(list);
    root.appendChild(section);
  }

  if (resume.skills && resume.skills.length > 0) {
    const section = createSection("Skills");
    const paragraph = document.createElement("p");
    paragraph.textContent = resume.skills.join(" · ");
    applyStyles(paragraph, { margin: "0" });
    section.appendChild(paragraph);
    root.appendChild(section);
  }

  if (resume.certifications && resume.certifications.length > 0) {
    const section = createSection("Certifications");
    const list = document.createElement("ul");
    applyStyles(list, { margin: "0", paddingLeft: "18px" });
    for (const cert of resume.certifications) {
      const item = document.createElement("li");
      item.textContent = [
        cert.name,
        cert.issuer ? ` — ${cert.issuer}` : "",
        cert.date ? ` (${cert.date})` : "",
      ].join("");
      list.appendChild(item);
    }
    section.appendChild(list);
    root.appendChild(section);
  }

  return root;
}
