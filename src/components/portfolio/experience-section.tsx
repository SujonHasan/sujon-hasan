"use client";

import { motion } from "framer-motion";
import { Building2, MapPin } from "lucide-react";
import { IExperience } from "@/types";
import { SectionHeading } from "./section-heading";
import { MotionWrapper } from "@/components/shared/motion-wrapper";
import { TimelineDot, TimelineTrack } from "@/components/shared/timeline-track";
import { formatDate } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";

interface ExperienceSectionProps {
  experiences: IExperience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (experiences.length === 0) return null;

  return (
    <section id="experience" className="relative py-24">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeading
          eyebrow="Career"
          title="Work Experience"
          subtitle="Where I have been building and shipping software."
        />

        <TimelineTrack>
          <div className="space-y-12">
            {experiences.map((exp, index) => {
              const isLeft = index % 2 === 0;

              return (
                <MotionWrapper key={exp._id} direction={isLeft ? "left" : "right"}>
                  <div
                    className={`relative flex items-start md:justify-between ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <TimelineDot />

                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      className={`ml-10 rounded-2xl border border-border/70 bg-card p-6 text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:shadow-[0_22px_50px_-26px_hsl(var(--primary)/0.55)] md:ml-0 md:w-[calc(50%_-_2.25rem)] ${
                        isLeft ? "md:mr-auto" : "md:ml-auto"
                      }`}
                    >
                      {exp.current && (
                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Current
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-foreground">{exp.position}</h3>

                      <p className="mt-1 flex items-center gap-1.5 font-medium text-primary">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {exp.company}
                      </p>

                      {exp.location && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {exp.location}
                        </p>
                      )}

                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {formatDate(exp.startDate)} —{" "}
                        {exp.current
                          ? "Present"
                          : exp.endDate
                          ? formatDate(exp.endDate)
                          : ""}
                      </p>

                      {exp.description && (
                        <div
                          className="prose prose-sm dark:prose-invert mt-3 max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichText(exp.description),
                          }}
                        />
                      )}

                      {exp.technologies.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {exp.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </MotionWrapper>
              );
            })}
          </div>
        </TimelineTrack>
      </div>
    </section>
  );
}
