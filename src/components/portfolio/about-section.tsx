"use client";

import { motion, useReducedMotion } from "framer-motion";
import { IAbout } from "@/types";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { sanitizeRichText } from "@/lib/sanitize";
import { SafeImage } from "@/components/shared/safe-image";
import { CountUp } from "@/components/shared/count-up";
import {
  MotionWrapper,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion-wrapper";

interface AboutSectionProps {
  about: IAbout | null;
}

export function AboutSection({ about }: AboutSectionProps) {
  const reduceMotion = useReducedMotion();

  const imageFallback = (
    <div className="w-72 h-72 md:w-80 md:h-80 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
      <span className="text-6xl font-bold text-primary/40">
        {about?.name?.charAt(0) || "S"}
      </span>
    </div>
  );

  return (
    <section id="about" className="relative py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <SectionHeading
          eyebrow="About"
          title="About Me"
          subtitle="A quick look at who I am and how I work."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: portrait, with a single square outline turning slowly
              behind it. Same size as the photo, so its corners swing in and
              out from behind the frame as it rotates. */}
          <MotionWrapper direction="left">
            <div className="relative flex justify-center py-10">
              <motion.div
                aria-hidden
                className="absolute top-1/2 left-1/2 h-72 w-72 md:h-80 md:w-80 rounded-[2rem] border-2 border-primary/25"
                style={{ x: "-50%", y: "-50%" }}
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
              />

              {about?.profileImage ? (
                <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-lg">
                  <SafeImage
                    src={about.profileImage}
                    alt={about.name || "Profile"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 288px, 320px"
                    fallback={imageFallback}
                  />
                </div>
              ) : (
                <div className="relative">{imageFallback}</div>
              )}
            </div>
          </MotionWrapper>

          {/* Right: bio */}
          <MotionWrapper direction="right">
            {about?.bio ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(about.bio) }}
              />
            ) : (
              <p className="text-muted-foreground text-lg">
                Bio information is not available yet.
              </p>
            )}
          </MotionWrapper>
        </div>

        {/* Stats */}
        {about?.stats && about.stats.length > 0 && (
          <StaggerContainer className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {about.stats.map((stat, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm transition-colors hover:border-primary/40"
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="relative">
                    <div className="mb-1 text-3xl md:text-4xl font-bold text-primary">
                      <CountUp value={stat.value} />
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
