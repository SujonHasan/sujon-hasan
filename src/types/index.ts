export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "editor";
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAbout {
  _id: string;
  name: string;
  tagline: string;
  bio: string;
  profileImage: string;
  resumeUrl: string;
  resumeTemplate: ResumeTemplateKey;
  stats: { label: string; value: string }[];
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
    facebook: string;
    website: string;
  };
  heroDescription: string;
  createdAt: string;
  updatedAt: string;
}

export type ResumeTemplateKey = "classic" | "compact" | "timeline";
export type PortfolioSectionKey =
  | "hero"
  | "about"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "certifications"
  | "contact";
export type PortfolioThemePreset = "default" | "minimal" | "modern" | "warm";
export type ThemeBackgroundStyle = "none" | "glow" | "grid" | "dots";
export type ThemeRadiusScale = "soft" | "rounded" | "sharp";

export interface IPortfolioSettings {
  _id: string;
  enabledSections: PortfolioSectionKey[];
  sectionOrder: PortfolioSectionKey[];
  updatedAt: string;
  createdAt: string;
}

export interface IThemeSettings {
  _id: string;
  themePreset: PortfolioThemePreset;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  backgroundStyle: ThemeBackgroundStyle;
  radiusScale: ThemeRadiusScale;
  showThemeToggle: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface IProject {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  images: string[];
  technologies: string[];
  category: string;
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  order: number;
  views: number;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
}

export interface ISkill {
  _id: string;
  name: string;
  category: "frontend" | "backend" | "database" | "tools" | "other";
  proficiency: number;
  icon: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IExperience {
  _id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  location: string;
  companyUrl: string;
  technologies: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IEducation {
  _id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  grade: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICertification {
  _id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string;
  credentialUrl: string;
  image: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IContact {
  _id: string;
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl: string;
  availability: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISeo {
  _id: string;
  page: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string;
  autoGenerate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAnalytics {
  _id: string;
  page: string;
  views: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
