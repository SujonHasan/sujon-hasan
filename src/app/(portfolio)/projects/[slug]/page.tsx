import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { IProject } from "@/types";
import { sanitizeRichText, sanitizeUrl, stripHtml } from "@/lib/sanitize";
import { groupTechnologies } from "@/lib/tech-stack";
import { SafeImage } from "@/components/shared/safe-image";
import { AnalyticsTracker } from "@/components/portfolio/analytics-tracker";
import { ProjectGallery } from "@/components/portfolio/project-gallery";
import { ProjectViewTracker } from "@/components/portfolio/project-view-tracker";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const categoryLabels: Record<string, string> = {
  fullstack: "Full Stack",
  frontend: "Frontend",
  backend: "Backend",
  web: "Web",
  mobile: "Mobile",
  ecommerce: "E-Commerce",
  other: "Other",
};

type ProjectNavItem = Pick<IProject, "_id" | "title" | "slug">;

/** Shared between generateMetadata and the page so the DB is hit once. */
const getProject = cache(async (slug: string): Promise<IProject | null> => {
  try {
    await connectDB();
    // Cards link by slug; fall back to the id for projects saved without one.
    const match = mongoose.isValidObjectId(slug) ? { $or: [{ slug }, { _id: slug }] } : { slug };
    const project = await Project.findOne({ ...match, status: "published" }).lean();
    return project ? JSON.parse(JSON.stringify(project)) : null;
  } catch {
    return null;
  }
});

async function getProjectNav(): Promise<ProjectNavItem[]> {
  try {
    await connectDB();
    const projects = await Project.find({ status: "published" })
      .select("title slug")
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(projects));
  } catch {
    return [];
  }
}

function projectHref(project: Pick<IProject, "_id" | "slug">) {
  return `/projects/${project.slug || project._id}`;
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return { title: "Project not found | Md. Sujon Hasan" };
  }

  const title = `${project.title} — Case Study | Md. Sujon Hasan`;
  const description = project.shortDescription || stripHtml(project.description).slice(0, 160);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return {
    ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
    title,
    description,
    keywords: project.technologies,
    openGraph: {
      title,
      description,
      type: "article",
      images: project.thumbnail ? [{ url: project.thumbnail }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, allProjects] = await Promise.all([getProject(slug), getProjectNav()]);

  if (!project) notFound();

  const liveUrl = sanitizeUrl(project.liveUrl);
  const githubUrl = sanitizeUrl(project.githubUrl);
  const content = sanitizeRichText(project.description);
  const year = project.year || String(new Date(project.createdAt).getFullYear());
  const categoryLabel = categoryLabels[project.category] || project.category;
  const techGroups = groupTechnologies(project.technologies);
  const gallery = (project.images || []).filter(Boolean);

  // Wrap around so every case study ends with somewhere to go next.
  const index = allProjects.findIndex((item) => item._id === project._id);
  const next = allProjects.length > 1 ? allProjects[(index + 1) % allProjects.length] : null;

  const facts = [
    { label: "Client", value: project.client },
    { label: "Role", value: project.role },
    { label: "Year", value: year },
    { label: "Type", value: categoryLabel },
  ].filter((fact) => fact.value);

  return (
    <article className="pb-8">
      <AnalyticsTracker page={`project:${project.slug || project._id}`} />
      <ProjectViewTracker projectId={project._id} />

      {/* ---------- Header ---------- */}
      <header className="mx-auto max-w-3xl px-4 pt-12 md:pt-20">
        <Link
          href="/#projects"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          All projects
        </Link>

        <h1 className="mt-10 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-6xl">
          {project.title}
        </h1>

        {project.shortDescription && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {project.shortDescription}
          </p>
        )}

        {(liveUrl || githubUrl) && (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                Visit {hostOf(liveUrl)}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                Source code
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border py-6 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ---------- Cover ---------- */}
      {project.thumbnail && (
        <figure className="mx-auto mt-4 max-w-5xl px-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
            <SafeImage
              src={project.thumbnail}
              alt={`${project.title} preview`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-top"
            />
          </div>
        </figure>
      )}

      {/* ---------- Write-up ---------- */}
      <div className="mx-auto max-w-3xl px-4 pt-16 md:pt-20">
        <div className="project-article" dangerouslySetInnerHTML={{ __html: content }} />

        {techGroups.length > 0 && (
          <section aria-labelledby="tech-stack-heading" className="mt-16">
            <h2 id="tech-stack-heading" className="project-section-title">
              Tech stack
            </h2>
            <dl className="divide-y divide-border border-y border-border">
              {techGroups.map((group) => (
                <div key={group.label} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                  <dt className="text-sm text-muted-foreground">{group.label}</dt>
                  <dd className="text-sm leading-relaxed">{group.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {gallery.length > 0 && (
          <section aria-labelledby="gallery-heading" className="mt-16">
            <h2 id="gallery-heading" className="project-section-title">
              Screenshots
            </h2>
            <ProjectGallery images={gallery} title={project.title} />
          </section>
        )}
      </div>

      {/* ---------- Next ---------- */}
      <footer className="mx-auto mt-24 max-w-3xl px-4">
        {next && (
          <Link href={projectHref(next)} className="group block border-t border-border pt-8">
            <span className="text-sm text-muted-foreground">Next project</span>
            <span className="mt-2 flex items-center justify-between gap-4">
              <span className="text-3xl font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary md:text-4xl">
                {next.title}
              </span>
              <ArrowRight className="h-7 w-7 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </span>
          </Link>
        )}

        <p className="mt-16 text-sm text-muted-foreground">
          Have a project like this in mind?{" "}
          <Link
            href="/#contact"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Let&apos;s talk
          </Link>
        </p>
      </footer>
    </article>
  );
}
