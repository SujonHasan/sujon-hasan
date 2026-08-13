"use client";

import { motion } from "framer-motion";
import { MotionWrapper } from "@/components/shared/motion-wrapper";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

export function SectionHeading({ title, subtitle, eyebrow }: SectionHeadingProps) {
  return (
    <MotionWrapper className="text-center mb-14">
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
          {eyebrow}
        </span>
      )}

      <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight mb-3">
        {title}
      </h2>

      {subtitle && (
        <p className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}

      {/* Underline draws itself the first time the heading scrolls into view. */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-5 h-1 w-24 origin-center rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
      />
    </MotionWrapper>
  );
}
