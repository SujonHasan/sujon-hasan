"use client";

import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";
import { ICertification } from "@/types";
import { SectionHeading } from "./section-heading";
import { StaggerContainer, StaggerItem } from "@/components/shared/motion-wrapper";
import { Spotlight } from "@/components/shared/spotlight";
import { formatDate } from "@/lib/utils";
import { sanitizeUrl } from "@/lib/sanitize";

interface CertificationsSectionProps {
  certifications: ICertification[];
}

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  if (certifications.length === 0) return null;

  return (
    <section id="certifications" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading
          eyebrow="Credentials"
          title="Certifications"
          subtitle="Courses and programmes that sharpened the toolkit."
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <StaggerItem key={cert._id} className="h-full">
              <Spotlight className="h-full rounded-2xl">
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:shadow-[0_22px_50px_-26px_hsl(var(--primary)/0.55)]"
                >
                  <div className="relative z-[2] mb-3 flex items-start gap-3">
                    <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {cert.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    </div>
                  </div>

                  <p className="relative z-[2] mt-auto pt-3 text-sm text-muted-foreground">
                    Issued {formatDate(cert.issueDate)}
                  </p>

                  {sanitizeUrl(cert.credentialUrl) && (
                    <a
                      href={sanitizeUrl(cert.credentialUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-[2] mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      View Credential
                      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )}
                </motion.div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
