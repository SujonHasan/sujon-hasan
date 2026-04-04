import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional().default(""),
  thumbnail: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  category: z.string().optional().default("web"),
  liveUrl: z.string().optional().default(""),
  githubUrl: z.string().optional().default(""),
  featured: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
  status: z.enum(["published", "draft"]).optional().default("published"),
});

export const skillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["frontend", "backend", "database", "tools", "other"]).optional().default("other"),
  proficiency: z.number().min(0).max(100).optional().default(50),
  icon: z.string().optional().default(""),
  order: z.number().optional().default(0),
});

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  description: z.string().optional().default(""),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional().default(null),
  current: z.boolean().optional().default(false),
  location: z.string().optional().default(""),
  companyUrl: z.string().optional().default(""),
  technologies: z.array(z.string()).optional().default([]),
  order: z.number().optional().default(0),
});

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().optional().default(""),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional().default(null),
  current: z.boolean().optional().default(false),
  grade: z.string().optional().default(""),
  description: z.string().optional().default(""),
  order: z.number().optional().default(0),
});

export const certificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  issuer: z.string().min(1, "Issuer is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().nullable().optional().default(null),
  credentialId: z.string().optional().default(""),
  credentialUrl: z.string().optional().default(""),
  image: z.string().optional().default(""),
  order: z.number().optional().default(0),
});

export const aboutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().optional().default(""),
  bio: z.string().min(1, "Bio is required"),
  profileImage: z.string().optional().default(""),
  resumeUrl: z.string().optional().default(""),
  heroDescription: z.string().optional().default(""),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  socialLinks: z
    .object({
      github: z.string().optional().default(""),
      linkedin: z.string().optional().default(""),
      twitter: z.string().optional().default(""),
      facebook: z.string().optional().default(""),
      website: z.string().optional().default(""),
    })
    .optional()
    .default({ github: "", linkedin: "", twitter: "", facebook: "", website: "" }),
});

export const contactSchema = z.object({
  email: z.string().email("Invalid email"),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  mapEmbedUrl: z.string().optional().default(""),
  availability: z.string().optional().default("Available for freelance"),
});

export const seoSchema = z.object({
  page: z.string().optional().default("home"),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
  ogImage: z.string().optional().default(""),
  autoGenerate: z.boolean().optional().default(false),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type AboutInput = z.infer<typeof aboutSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SeoInput = z.infer<typeof seoSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
