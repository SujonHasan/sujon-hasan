"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { IAbout } from "@/types";
import { GithubIcon, LinkedinIcon, FacebookIcon } from "@/components/shared/icons";
import { sanitizeUrl } from "@/lib/sanitize";
import { AuroraBackground } from "@/components/shared/aurora-background";
import { TextRotator } from "@/components/shared/text-rotator";

interface HeroSectionProps {
  about: IAbout | null;
}

const socialIcons: Record<string, React.ElementType> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookIcon,
};

const socialLabels: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

/**
 * A tagline written as "Full Stack Developer | MERN Specialist" becomes an
 * animated rotator; a single-phrase tagline stays static.
 */
function splitTagline(tagline: string) {
  return tagline
    .split(/\s*[|•·]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function HeroSection({ about }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const name = about?.name || "Md. Sujon Hasan";
  const tagline = about?.tagline || "";
  const heroDescription = about?.heroDescription || "";
  const socialLinks = about?.socialLinks;
  const generatedResumeUrl = "/api/resume/download";

  const taglineParts = splitTagline(tagline);
  const nameChars = name.split("");

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.035 } },
  };

  const charVariants = {
    hidden: { opacity: 0, y: 28, rotateX: -60 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const socialEntries = socialLinks
    ? Object.entries(socialLinks).filter(
        ([key, value]) => value && sanitizeUrl(value) && socialIcons[key]
      )
    : [];

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-24">
        {/* Availability pill */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-1.5 text-xs font-medium backdrop-blur-md mb-7"
        >
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Available for new projects
        </motion.div>

        {/* Name — the split characters are decorative, so the readable name
            lives on the heading itself for screen readers. */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-label={name}
        >
          {/* The gradient sits on each character rather than on the wrapper:
              framer-motion transforms the characters, and a transformed child
              paints outside the parent's `background-clip: text`, which left
              the whole name invisible. Offsetting the animation per character
              also makes the colour wave travel across the name. */}
          <span aria-hidden className="inline-block [perspective:600px]">
            {nameChars.map((char, index) => (
              <motion.span
                key={index}
                variants={charVariants}
                className="text-gradient inline-block"
                style={{
                  whiteSpace: char === " " ? "pre" : undefined,
                  animationDelay: `${index * -0.14}s`,
                }}
              >
                {char === " " ? " " : char}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* Tagline / role rotator */}
        {taglineParts.length > 0 && (
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-5 flex flex-wrap items-center justify-center gap-x-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {taglineParts.length > 1 ? (
              <>
                <span className="text-muted-foreground">I work as a</span>
                <TextRotator items={taglineParts} className="h-[1.4em]" />
              </>
            ) : (
              <span className="font-medium text-foreground/90">{taglineParts[0]}</span>
            )}
          </motion.p>
        )}

        {/* Hero description */}
        {heroDescription && (
          <motion.p
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          >
            {heroDescription}
          </motion.p>
        )}

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="#projects"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-medium text-primary-foreground glow-ring transition-shadow hover:shadow-[0_22px_60px_-16px_hsl(var(--primary)/0.75)]"
            >
              View My Work
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <a
              href={generatedResumeUrl}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-8 py-3.5 font-medium backdrop-blur-md transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              Download Resume
            </a>
          </motion.div>
        </motion.div>

        {/* Social links */}
        {socialEntries.length > 0 && (
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.5 }}
          >
            {socialEntries.map(([key, url]) => {
              const Icon = socialIcons[key];
              const safeUrl = sanitizeUrl(url);
              if (!safeUrl) return null;
              return (
                <motion.a
                  key={key}
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={socialLabels[key] || key}
                  className="rounded-full border border-border/70 bg-background/60 p-3 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary hover:text-primary"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Scroll hint */}
      <motion.a
        href="#about"
        aria-label="Scroll to about section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
      >
        <span className="text-[11px] uppercase tracking-[0.2em]">Scroll</span>
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <MousePointerClick className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
