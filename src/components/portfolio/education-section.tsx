"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { IEducation } from "@/types";
import { SectionHeading } from "./section-heading";
import { MotionWrapper } from "@/components/shared/motion-wrapper";
import { TimelineDot, TimelineTrack } from "@/components/shared/timeline-track";
import { formatDate } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";

interface EducationSectionProps {
  education: IEducation[];
}

export function EducationSection({ education }: EducationSectionProps) {
  if (education.length === 0) return null;

  return (
    <section id="education" className="relative py-24">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeading
          eyebrow="Academics"
          title="Education"
          subtitle="Formal training behind the engineering work."
        />

        <TimelineTrack>
          <div className="space-y-12">
            {education.map((edu, index) => {
              const isLeft = index % 2 === 0;

              return (
                <MotionWrapper key={edu._id} direction={isLeft ? "left" : "right"}>
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
                      <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                        <GraduationCap className="h-5 w-5" />
                      </div>

                      <h3 className="text-lg font-bold text-foreground">{edu.institution}</h3>
                      <p className="font-medium text-primary">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground">{edu.field}</p>

                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {formatDate(edu.startDate)} —{" "}
                        {edu.current
                          ? "Present"
                          : edu.endDate
                          ? formatDate(edu.endDate)
                          : ""}
                      </p>

                      {edu.grade && (
                        <p className="mt-2 text-sm text-card-foreground">
                          <span className="font-medium">Grade:</span> {edu.grade}
                        </p>
                      )}

                      {edu.description && (
                        <div
                          className="prose prose-sm dark:prose-invert mt-3 max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichText(edu.description),
                          }}
                        />
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
