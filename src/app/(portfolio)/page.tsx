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
  IAbout,
  ICertification,
  IContact,
  IEducation,
  IExperience,
  IProject,
  ISkill,
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

  try {
    await connectDB();

    [about, projects, skills, experiences, education, certifications, contact] =
      await Promise.all([
        getLatestAboutLean(),
        Project.find({ status: "published" }).sort({ order: 1, createdAt: -1 }).lean(),
        Skill.find().sort({ order: 1 }).lean(),
        Experience.find().sort({ order: 1, startDate: -1 }).lean(),
        Education.find().sort({ order: 1, startDate: -1 }).lean(),
        Certification.find().sort({ order: 1, issueDate: -1 }).lean(),
        Contact.findOne().lean(),
      ]);
  } catch {
    // Render a safe empty state when the database is temporarily unavailable.
  }

  // Serialize Mongoose documents to plain objects
  const serialize = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

  return (
    <>
      <AnalyticsTracker page="home" />
      <HeroSection about={serialize(about)} />
      <AboutSection about={serialize(about)} />
      <SkillsSection skills={serialize(skills) || []} />
      <ProjectsSection projects={serialize(projects) || []} />
      <ExperienceSection experiences={serialize(experiences) || []} />
      <EducationSection education={serialize(education) || []} />
      <CertificationsSection certifications={serialize(certifications) || []} />
      <ContactSection contact={serialize(contact)} />
    </>
  );
}
