import { connectDB } from "@/lib/db";
import { getLatestAboutLean } from "@/lib/about";
import { RESUME_TEMPLATES } from "@/lib/resume-templates";
import { formatDate } from "@/lib/utils";
import { sanitizeUrl, stripHtml } from "@/lib/sanitize";
import { ResumeTemplateKey } from "@/types";
import Contact from "@/models/Contact";
import Skill from "@/models/Skill";
import Experience from "@/models/Experience";
import Education from "@/models/Education";
import Certification from "@/models/Certification";
import Project from "@/models/Project";

export function normalizeResumeTemplate(value?: string | null): ResumeTemplateKey {
  if (value === "compact" || value === "timeline") {
    return value;
  }

  return "classic";
}

type ResumeEntry = {
  title: string;
  subtitle?: string;
  meta?: string;
  body?: string[];
};

export type ResumeData = {
  template: ResumeTemplateKey;
  name: string;
  tagline: string;
  summary: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  linkedin: string;
  github: string;
  skills: string[];
  projects: ResumeEntry[];
  experiences: ResumeEntry[];
  education: ResumeEntry[];
  certifications: ResumeEntry[];
};

function joinParts(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" • ");
}

function cleanText(value?: string | null) {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

export async function getResumeData(templateOverride?: string | null): Promise<ResumeData> {
  await connectDB();

  const [about, contact, skills, projects, experiences, education, certifications] =
    await Promise.all([
      getLatestAboutLean(),
      Contact.findOne().lean(),
      Skill.find().sort({ proficiency: -1, order: 1 }).lean(),
      Project.find({ status: "published" }).sort({ featured: -1, order: 1, createdAt: -1 }).limit(4).lean(),
      Experience.find().sort({ current: -1, startDate: -1, order: 1 }).lean(),
      Education.find().sort({ current: -1, endDate: -1, startDate: -1, order: 1 }).lean(),
      Certification.find().sort({ issueDate: -1, order: 1 }).lean(),
    ]);

  const template = normalizeResumeTemplate(templateOverride || about?.resumeTemplate);

  return {
    template,
    name: about?.name || "Md. Sujon Hasan",
    tagline: about?.tagline || "Full Stack Developer",
    summary: cleanText(about?.bio || about?.heroDescription) || "Full Stack Developer focused on building reliable web products.",
    email: contact?.email || "",
    phone: contact?.phone || "",
    address: contact?.address || "",
    website: sanitizeUrl(about?.socialLinks?.website || about?.resumeUrl) || "",
    linkedin: sanitizeUrl(about?.socialLinks?.linkedin) || "",
    github: sanitizeUrl(about?.socialLinks?.github) || "",
    skills: skills.map((skill) => skill.name).slice(0, 14),
    projects: projects.map((project) => ({
      title: project.title,
      subtitle: project.category ? project.category.toUpperCase() : undefined,
      meta: project.technologies?.length
        ? project.technologies.slice(0, 5).join(", ")
        : undefined,
      body: [cleanText(project.shortDescription || project.description)].filter(Boolean),
    })),
    experiences: experiences.map((experience) => ({
      title: experience.position,
      subtitle: experience.company,
      meta: joinParts([
        joinParts([
          formatDate(experience.startDate),
          experience.current
            ? "Present"
            : experience.endDate
            ? formatDate(experience.endDate)
            : undefined,
        ]),
        experience.location || undefined,
      ]),
      body: [
        cleanText(experience.description),
        experience.technologies?.length
          ? `Technologies: ${experience.technologies.join(", ")}`
          : "",
      ].filter(Boolean),
    })),
    education: education.map((item) => ({
      title: item.institution,
      subtitle: joinParts([item.degree, item.field]),
      meta: joinParts([
        joinParts([
          formatDate(item.startDate),
          item.current ? "Present" : item.endDate ? formatDate(item.endDate) : undefined,
        ]),
        item.grade || undefined,
      ]),
      body: cleanText(item.description) ? [cleanText(item.description)] : [],
    })),
    certifications: certifications.map((item) => ({
      title: item.title,
      subtitle: item.issuer,
      meta: joinParts([
        `Issued ${formatDate(item.issueDate)}`,
        item.credentialId ? `ID: ${item.credentialId}` : undefined,
      ]),
      body: item.credentialUrl ? [item.credentialUrl] : [],
    })),
  };
}

type FontName = "F1" | "F2";

type TextOptions = {
  x: number;
  y: number;
  size?: number;
  font?: FontName;
  color?: [number, number, number];
};

class PdfPage {
  width = 595;
  height = 842;
  commands: string[] = [];

  add(command: string) {
    this.commands.push(command);
  }
}

function rgb(color: [number, number, number]) {
  return `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)}`;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function estimateTextWidth(text: string, size: number, font: FontName) {
  const factor = font === "F2" ? 0.58 : 0.52;
  return text.length * size * factor;
}

function wrapText(text: string, maxWidth: number, size: number, font: FontName) {
  const lines: string[] = [];
  const paragraphs = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (estimateTextWidth(candidate, size, font) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [""];
}

function drawText(page: PdfPage, text: string, options: TextOptions) {
  const size = options.size ?? 12;
  const font = options.font ?? "F1";
  const color = options.color ?? [0, 0, 0];

  page.add(
    `BT /${font} ${size} Tf ${rgb(color)} rg 1 0 0 1 ${options.x.toFixed(2)} ${options.y.toFixed(2)} Tm (${escapePdfText(
      text
    )}) Tj ET`
  );
}

function drawRect(
  page: PdfPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number]
) {
  page.add(`${rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
}

function drawLine(
  page: PdfPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: [number, number, number],
  width = 1
) {
  page.add(`${width.toFixed(2)} w ${rgb(color)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
}

function createDocument(pages: PdfPage[]) {
  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };

  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageRefs: number[] = [];
  const contentRefs: number[] = [];

  for (const page of pages) {
    const content = page.commands.join("\n");
    const contentRef = addObject(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
    contentRefs.push(contentRef);
    pageRefs.push(0);
  }

  const pagesRef = objects.length + pages.length + 1;

  pages.forEach((page, index) => {
    pageRefs[index] = addObject(
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentRefs[index]} 0 R >>`
    );
  });

  const kids = pageRefs.map((ref) => `${ref} 0 R`).join(" ");
  const actualPagesRef = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageRefs.length} >>`);
  const catalogRef = addObject(`<< /Type /Catalog /Pages ${actualPagesRef} 0 R >>`);

  let output = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output, "utf8"));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, "utf8");
}

function renderClassicTemplate(data: ResumeData) {
  const pages: PdfPage[] = [];
  let page = new PdfPage();
  let y = 790;
  const margin = 44;
  const lineHeight = 14;
  const sectionGap = 18;

  const newPage = () => {
    pages.push(page);
    page = new PdfPage();
    y = 790;
  };

  const ensureSpace = (height: number) => {
    if (y - height < 60) {
      newPage();
    }
  };

  drawRect(page, 0, 758, page.width, 84, [0.11, 0.16, 0.28]);
  drawText(page, data.name, { x: margin, y: 802, size: 24, font: "F2", color: [1, 1, 1] });
  drawText(page, data.tagline, { x: margin, y: 778, size: 12, color: [0.9, 0.93, 1] });
  drawText(page, [data.email, data.phone, data.address].filter(Boolean).join(" • "), {
    x: margin,
    y: 760,
    size: 9,
    color: [0.82, 0.88, 0.98],
  });

  y = 730;

  const addSection = (title: string, body: () => void) => {
    ensureSpace(40);
    drawText(page, title.toUpperCase(), { x: margin, y, size: 11, font: "F2", color: [0.13, 0.22, 0.42] });
    drawLine(page, margin, y - 6, page.width - margin, y - 6, [0.8, 0.84, 0.92], 1);
    y -= 24;
    body();
    y -= sectionGap;
  };

  addSection("Professional Summary", () => {
    const lines = wrapText(data.summary, page.width - margin * 2, 11, "F1");
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      drawText(page, line, { x: margin, y, size: 11, color: [0.18, 0.2, 0.24] });
      y -= lineHeight;
    });
  });

  addSection("Core Skills", () => {
    const lines = wrapText(data.skills.join(" • "), page.width - margin * 2, 10, "F1");
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      drawText(page, line, { x: margin, y, size: 10, color: [0.18, 0.2, 0.24] });
      y -= lineHeight;
    });
  });

  if (data.projects.length > 0) {
    addSection("Selected Projects", () => {
      data.projects.forEach((entry) => {
        ensureSpace(40);
        drawText(page, entry.title, { x: margin, y, size: 11, font: "F2" });
        y -= 13;
        drawText(page, joinParts([entry.subtitle, entry.meta]), {
          x: margin,
          y,
          size: 9,
          color: [0.38, 0.42, 0.5],
        });
        y -= 12;
        entry.body?.forEach((item) => {
          wrapText(item, page.width - margin * 2, 9.5, "F1").forEach((line) => {
            ensureSpace(lineHeight);
            drawText(page, line, { x: margin, y, size: 9.5 });
            y -= lineHeight;
          });
        });
        y -= 8;
      });
    });
  }

  addSection("Experience", () => {
    data.experiences.forEach((entry) => {
      ensureSpace(46);
      drawText(page, entry.title, { x: margin, y, size: 12, font: "F2" });
      if (entry.meta) {
        drawText(page, entry.meta, { x: page.width - margin - estimateTextWidth(entry.meta, 9, "F1"), y: y + 1, size: 9, color: [0.38, 0.42, 0.5] });
      }
      y -= 14;
      if (entry.subtitle) {
        drawText(page, entry.subtitle, { x: margin, y, size: 10, color: [0.13, 0.22, 0.42] });
        y -= 14;
      }
      entry.body?.forEach((item) => {
        wrapText(item, page.width - margin * 2 - 10, 10, "F1").forEach((line) => {
          ensureSpace(lineHeight);
          drawText(page, `• ${line}`, { x: margin + 8, y, size: 10, color: [0.18, 0.2, 0.24] });
          y -= lineHeight;
        });
      });
      y -= 6;
    });
  });

  addSection("Education", () => {
    data.education.forEach((entry) => {
      ensureSpace(38);
      drawText(page, entry.title, { x: margin, y, size: 11, font: "F2" });
      y -= 14;
      if (entry.subtitle) {
        drawText(page, entry.subtitle, { x: margin, y, size: 10, color: [0.13, 0.22, 0.42] });
        y -= 14;
      }
      if (entry.meta) {
        drawText(page, entry.meta, { x: margin, y, size: 9, color: [0.38, 0.42, 0.5] });
        y -= 13;
      }
      entry.body?.forEach((item) => {
        wrapText(item, page.width - margin * 2, 10, "F1").forEach((line) => {
          ensureSpace(lineHeight);
          drawText(page, line, { x: margin, y, size: 10 });
          y -= lineHeight;
        });
      });
      y -= 4;
    });
  });

  if (data.certifications.length > 0) {
    addSection("Certifications", () => {
      data.certifications.forEach((entry) => {
        ensureSpace(30);
        drawText(page, entry.title, { x: margin, y, size: 10, font: "F2" });
        y -= 13;
        drawText(page, joinParts([entry.subtitle, entry.meta]), {
          x: margin,
          y,
          size: 9,
          color: [0.38, 0.42, 0.5],
        });
        y -= 16;
      });
    });
  }

  pages.push(page);
  return pages;
}

function renderCompactTemplate(data: ResumeData) {
  const pages: PdfPage[] = [];
  let page = new PdfPage();
  let y = 790;
  const margin = 38;
  const lineHeight = 13;

  const newPage = () => {
    pages.push(page);
    page = new PdfPage();
    y = 790;
  };

  const ensureSpace = (height: number) => {
    if (y - height < 52) {
      newPage();
    }
  };

  drawRect(page, margin, 752, page.width - margin * 2, 64, [0.08, 0.11, 0.18]);
  drawText(page, data.name, { x: margin + 16, y: 789, size: 22, font: "F2", color: [1, 1, 1] });
  drawText(page, data.tagline, { x: margin + 16, y: 767, size: 11, color: [0.85, 0.9, 0.98] });

  const links = [data.email, data.phone, data.github, data.linkedin].filter(Boolean).join(" • ");
  drawText(page, links, { x: margin + 16, y: 754, size: 8.5, color: [0.78, 0.85, 0.98] });

  y = 724;

  const addSectionHeader = (title: string) => {
    ensureSpace(30);
    drawRect(page, margin, y - 4, 132, 16, [0.9, 0.93, 0.98]);
    drawText(page, title, { x: margin + 8, y: y + 2, size: 9, font: "F2", color: [0.12, 0.2, 0.36] });
    y -= 24;
  };

  addSectionHeader("PROFILE");
  wrapText(data.summary, page.width - margin * 2, 10, "F1").forEach((line) => {
    ensureSpace(lineHeight);
    drawText(page, line, { x: margin, y, size: 10 });
    y -= lineHeight;
  });

  y -= 6;
  addSectionHeader("SKILLS SNAPSHOT");
  const skillLines = wrapText(data.skills.join(" • "), page.width - margin * 2, 9.5, "F1");
  skillLines.forEach((line) => {
    ensureSpace(lineHeight);
    drawText(page, line, { x: margin, y, size: 9.5, color: [0.18, 0.2, 0.24] });
    y -= lineHeight;
  });

  y -= 6;
  if (data.projects.length > 0) {
    addSectionHeader("PROJECT HIGHLIGHTS");
    data.projects.forEach((entry) => {
      ensureSpace(36);
      drawText(page, entry.title, { x: margin, y, size: 10.5, font: "F2" });
      y -= 12;
      drawText(page, joinParts([entry.subtitle, entry.meta]), {
        x: margin,
        y,
        size: 8.5,
        color: [0.38, 0.42, 0.5],
      });
      y -= 11;
      entry.body?.forEach((item) => {
        wrapText(item, page.width - margin * 2, 9, "F1").forEach((line) => {
          ensureSpace(lineHeight);
          drawText(page, line, { x: margin, y, size: 9 });
          y -= lineHeight;
        });
      });
      y -= 6;
    });
  }

  y -= 6;
  addSectionHeader("EXPERIENCE");
  data.experiences.forEach((entry) => {
    ensureSpace(48);
    drawText(page, entry.title, { x: margin, y, size: 11, font: "F2" });
    if (entry.meta) {
      drawText(page, entry.meta, { x: margin + 250, y, size: 8.5, color: [0.38, 0.42, 0.5] });
    }
    y -= 13;
    if (entry.subtitle) {
      drawText(page, entry.subtitle, { x: margin, y, size: 9.5, color: [0.14, 0.25, 0.45] });
      y -= 12;
    }
    entry.body?.forEach((item) => {
      wrapText(item, page.width - margin * 2 - 12, 9.5, "F1").forEach((line) => {
        ensureSpace(lineHeight);
        drawText(page, `- ${line}`, { x: margin + 6, y, size: 9.5 });
        y -= lineHeight;
      });
    });
    y -= 6;
  });

  addSectionHeader("EDUCATION");
  data.education.forEach((entry) => {
    ensureSpace(32);
    drawText(page, entry.title, { x: margin, y, size: 10.5, font: "F2" });
    y -= 13;
    drawText(page, joinParts([entry.subtitle, entry.meta]), {
      x: margin,
      y,
      size: 9,
      color: [0.38, 0.42, 0.5],
    });
    y -= 16;
  });

  if (data.certifications.length > 0) {
    addSectionHeader("CERTIFICATIONS");
    data.certifications.slice(0, 6).forEach((entry) => {
      ensureSpace(24);
      drawText(page, `${entry.title} — ${entry.subtitle || ""}`, { x: margin, y, size: 9.5, font: "F2" });
      y -= 12;
      if (entry.meta) {
        drawText(page, entry.meta, { x: margin, y, size: 8.5, color: [0.38, 0.42, 0.5] });
        y -= 14;
      }
    });
  }

  pages.push(page);
  return pages;
}

function renderTimelineTemplate(data: ResumeData) {
  const pages: PdfPage[] = [];
  let page = new PdfPage();
  let y = 792;
  const margin = 42;
  const timelineX = 160;
  const lineHeight = 13;

  const newPage = () => {
    pages.push(page);
    page = new PdfPage();
    y = 792;
  };

  const ensureSpace = (height: number) => {
    if (y - height < 60) {
      newPage();
    }
  };

  drawText(page, data.name, { x: margin, y, size: 24, font: "F2", color: [0.1, 0.13, 0.2] });
  drawText(page, data.tagline, { x: margin, y: 770, size: 11, color: [0.25, 0.33, 0.48] });
  drawText(page, [data.email, data.phone, data.github, data.linkedin].filter(Boolean).join(" • "), {
    x: margin,
    y: 754,
    size: 9,
    color: [0.35, 0.39, 0.46],
  });

  y = 724;
  drawLine(page, timelineX, 80, timelineX, 724, [0.8, 0.84, 0.9], 1.25);

  drawText(page, "SUMMARY", { x: margin, y, size: 10, font: "F2", color: [0.12, 0.24, 0.44] });
  y -= 18;
  wrapText(data.summary, page.width - margin * 2, 10, "F1").forEach((line) => {
    ensureSpace(lineHeight);
    drawText(page, line, { x: margin, y, size: 10 });
    y -= lineHeight;
  });

  y -= 12;
  if (data.projects.length > 0) {
    drawText(page, "PROJECTS", { x: margin, y, size: 10, font: "F2", color: [0.12, 0.24, 0.44] });
    y -= 18;
    data.projects.forEach((entry) => {
      ensureSpace(34);
      drawText(page, entry.title, { x: margin, y, size: 10.5, font: "F2" });
      y -= 12;
      drawText(page, joinParts([entry.subtitle, entry.meta]), {
        x: margin,
        y,
        size: 8.5,
        color: [0.38, 0.42, 0.5],
      });
      y -= 11;
      entry.body?.forEach((item) => {
        wrapText(item, page.width - margin * 2, 9.2, "F1").forEach((line) => {
          ensureSpace(lineHeight);
          drawText(page, line, { x: margin, y, size: 9.2 });
          y -= lineHeight;
        });
      });
      y -= 8;
    });
    y -= 4;
  }

  drawText(page, "CAREER TIMELINE", { x: margin, y, size: 10, font: "F2", color: [0.12, 0.24, 0.44] });
  y -= 20;

  data.experiences.forEach((entry) => {
    ensureSpace(56);
    drawRect(page, timelineX - 3, y - 2, 6, 6, [0.12, 0.24, 0.44]);
    drawText(page, entry.meta || "", { x: margin, y, size: 8.5, color: [0.38, 0.42, 0.5] });
    drawText(page, entry.title, { x: timelineX + 18, y, size: 11, font: "F2" });
    y -= 13;
    if (entry.subtitle) {
      drawText(page, entry.subtitle, { x: timelineX + 18, y, size: 9.5, color: [0.12, 0.24, 0.44] });
      y -= 12;
    }
    entry.body?.forEach((item) => {
      wrapText(item, page.width - timelineX - margin - 18, 9.5, "F1").forEach((line) => {
        ensureSpace(lineHeight);
        drawText(page, line, { x: timelineX + 18, y, size: 9.5 });
        y -= lineHeight;
      });
    });
    y -= 10;
  });

  ensureSpace(70);
  drawText(page, "EDUCATION", { x: margin, y, size: 10, font: "F2", color: [0.12, 0.24, 0.44] });
  y -= 18;
  data.education.forEach((entry) => {
    ensureSpace(28);
    drawText(page, entry.title, { x: margin, y, size: 10.5, font: "F2" });
    y -= 12;
    drawText(page, joinParts([entry.subtitle, entry.meta]), { x: margin, y, size: 9, color: [0.38, 0.42, 0.5] });
    y -= 16;
  });

  ensureSpace(60);
  drawText(page, "SKILLS & CERTIFICATIONS", { x: margin, y, size: 10, font: "F2", color: [0.12, 0.24, 0.44] });
  y -= 18;
  wrapText(`Skills: ${data.skills.join(", ")}`, page.width - margin * 2, 9.5, "F1").forEach((line) => {
    ensureSpace(lineHeight);
    drawText(page, line, { x: margin, y, size: 9.5 });
    y -= lineHeight;
  });
  data.certifications.slice(0, 5).forEach((entry) => {
    ensureSpace(24);
    drawText(page, `${entry.title} — ${joinParts([entry.subtitle, entry.meta])}`, {
      x: margin,
      y,
      size: 9,
      color: [0.18, 0.2, 0.24],
    });
    y -= 14;
  });

  pages.push(page);
  return pages;
}

export function generateResumePdf(data: ResumeData, template: ResumeTemplateKey) {
  const pages =
    template === "compact"
      ? renderCompactTemplate(data)
      : template === "timeline"
      ? renderTimelineTemplate(data)
      : renderClassicTemplate(data);

  return createDocument(pages);
}
