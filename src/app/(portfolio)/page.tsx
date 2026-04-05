import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Skill from "@/models/Skill";
import Experience from "@/models/Experience";
import Education from "@/models/Education";
import Certification from "@/models/Certification";
import Contact from "@/models/Contact";
import Seo from "@/models/Seo";
import { getLatestAboutLean } from "@/lib/about";
import { HeroSection } from "@/components/portfolio/hero-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { EducationSection } from "@/components/portfolio/education-section";
import { CertificationsSection } from "@/components/portfolio/certifications-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { AnalyticsTracker } from "@/components/portfolio/analytics-tracker";
import {
  DEFAULT_ENABLED_PORTFOLIO_SECTIONS,
  DEFAULT_PORTFOLIO_SECTION_ORDER,
} from "@/lib/portfolio-config";
import { getPortfolioSettingsLean } from "@/lib/portfolio-settings";
import {
  IAbout,
  ICertification,
  IContact,
  IEducation,
  IExperience,
  IPortfolioSettings,
  IProject,
  ISkill,
  PortfolioSectionKey,
} from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectDB();
    const seo = await Seo.findOne({ page: "home" }).lean();

    if (seo) {
      return {
        title: seo.metaTitle || "Md. Sujon Hasan | Full Stack Developer",
        description: seo.metaDescription || "Full Stack Developer specializing in MERN Stack",
        keywords: (seo.keywords as string[]) || [],
        openGraph: {
          title: seo.metaTitle as string || "Md. Sujon Hasan | Full Stack Developer",
          description: seo.metaDescription as string || "",
          images: seo.ogImage ? [{ url: seo.ogImage as string }] : [],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: seo.metaTitle as string || "Md. Sujon Hasan",
          description: seo.metaDescription as string || "",
        },
      };
    }
  } catch {
    // Fallback
  }

  return {
    title: "Md. Sujon Hasan | Full Stack Developer (MERN Stack)",
    description: "Full Stack Developer specializing in MERN Stack. Building modern web applications with React, Node.js, and MongoDB.",
  };
}

export default async function HomePage() {
  let about: IAbout | null = null;
  let projects: IProject[] = [];
  let skills: ISkill[] = [];
  let experiences: IExperience[] = [];
  let education: IEducation[] = [];
  let certifications: ICertification[] = [];
  let contact: IContact | null = null;
  let settings: Pick<IPortfolioSettings, "enabledSections" | "sectionOrder"> = {
    enabledSections: DEFAULT_ENABLED_PORTFOLIO_SECTIONS,
    sectionOrder: DEFAULT_PORTFOLIO_SECTION_ORDER,
  };

  try {
    await connectDB();

    [about, projects, skills, experiences, education, certifications, contact, settings] =
      await Promise.all([
        getLatestAboutLean(),
        Project.find({ status: "published" }).sort({ order: 1, createdAt: -1 }).lean(),
        Skill.find().sort({ order: 1 }).lean(),
        Experience.find().sort({ order: 1, startDate: -1 }).lean(),
        Education.find().sort({ order: 1, startDate: -1 }).lean(),
        Certification.find().sort({ order: 1, issueDate: -1 }).lean(),
        Contact.findOne().lean(),
        getPortfolioSettingsLean(),
      ]);
  } catch {
    // Render a safe empty state when the database is temporarily unavailable.
  }

  // Serialize Mongoose documents to plain objects
  const serialize = <T,>(data: T): T => JSON.parse(JSON.stringify(data));
  const serializedAbout = serialize(about);
  const serializedSkills = serialize(skills) || [];
  const serializedProjects = serialize(projects) || [];
  const serializedExperiences = serialize(experiences) || [];
  const serializedEducation = serialize(education) || [];
  const serializedCertifications = serialize(certifications) || [];
  const serializedContact = serialize(contact);

  const sectionMap: Record<PortfolioSectionKey, React.ReactNode> = {
    hero: <HeroSection about={serializedAbout} />,
    about: <AboutSection about={serializedAbout} />,
    skills: <SkillsSection skills={serializedSkills} />,
    projects: <ProjectsSection projects={serializedProjects} />,
    experience: <ExperienceSection experiences={serializedExperiences} />,
    education: <EducationSection education={serializedEducation} />,
    certifications: <CertificationsSection certifications={serializedCertifications} />,
    contact: <ContactSection contact={serializedContact} />,
  };

  const visibleSections = settings.sectionOrder.filter((sectionId) =>
    settings.enabledSections.includes(sectionId)
  );

  return (
    <>
      <AnalyticsTracker page="home" />
      {visibleSections.map((sectionId) => (
        <div key={sectionId}>{sectionMap[sectionId]}</div>
      ))}
    </>
  );
}
