"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GithubIcon } from "@/components/shared/icons";
import { IProject } from "@/types";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion-wrapper";
import { Spotlight } from "@/components/shared/spotlight";
import { Badge } from "@/components/ui/badge";
import { sanitizeUrl } from "@/lib/sanitize";
import { SafeImage } from "@/components/shared/safe-image";

interface ProjectsSectionProps {
  projects: IProject[];
}

const MAX_VISIBLE_TECH = 4;

const categoryLabels: Record<string, string> = {
  fullstack: "Full Stack",
  frontend: "Frontend",
  backend: "Backend",
  web: "Web",
  mobile: "Mobile",
  ecommerce: "E-Commerce",
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  // Copy before sorting — the array comes straight from props.
  const ordered = [...projects].sort((a, b) => a.order - b.order);

  if (ordered.length === 0) return null;

  return (
    <section id="projects" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading
          title="Featured Projects"
          subtitle="Real products shipped for real clients — from e-commerce platforms to corporate websites."
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ordered.map((project) => {
            const liveUrl = sanitizeUrl(project.liveUrl);
            const githubUrl = sanitizeUrl(project.githubUrl);
            const visibleTech = project.technologies.slice(0, MAX_VISIBLE_TECH);
            const hiddenTechCount = project.technologies.length - visibleTech.length;

            return (
              <StaggerItem key={project._id} className="h-full">
                <Spotlight className="h-full rounded-2xl">
                  <motion.article
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="shimmer-on-hover group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow duration-300 hover:border-primary/40 hover:shadow-[0_28px_60px_-24px_hsl(var(--primary)/0.45)]"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {project.thumbnail ? (
                        <SafeImage
                          src={project.thumbnail}
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-transparent">
                              <span className="text-4xl font-bold text-primary/40">
                                {project.title.charAt(0)}
                              </span>
                            </div>
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-transparent">
                          <span className="text-4xl font-bold text-primary/40">
                            {project.title.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Darkening veil that reveals the action buttons */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="absolute inset-x-0 bottom-0 flex translate-y-4 items-center gap-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        {liveUrl && (
                          <Link
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-lg transition-transform hover:scale-105"
                          >
                            Live Demo
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {githubUrl && (
                          <Link
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${project.title} source code`}
                            className="inline-flex items-center justify-center rounded-full bg-white/15 p-2.5 text-white ring-1 ring-white/40 backdrop-blur-md transition-transform hover:scale-105"
                          >
                            <GithubIcon className="h-4 w-4" />
                          </Link>
                        )}
                      </div>

                      {/* Corner tags */}
                      <div className="absolute left-3 top-3 flex items-center gap-2">
                        {project.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-md">
                            <Sparkles className="h-3 w-3" />
                            Featured
                          </span>
                        )}
                        {project.category && (
                          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-md">
                            {categoryLabels[project.category] || project.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="relative z-[2] flex flex-1 flex-col p-5">
                      <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-primary">
                        {project.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {project.shortDescription}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {visibleTech.map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="border border-border/60 bg-secondary/60 text-xs font-normal"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {hiddenTechCount > 0 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            +{hiddenTechCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.article>
                </Spotlight>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
