"use client";

import { ReactNode, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Rail geometry is expressed with `left` alone rather than Tailwind's
 * `-translate-x-*` helpers: framer-motion writes its own inline `transform`
 * for the animated values, which would drop any translate coming from a class
 * and knock the rail and its dots out of alignment.
 */
// Underscores stand in for the spaces CSS `calc()` requires — Tailwind strips
// them back out. Written as `calc(50%-1px)` the declaration is invalid and
// gets dropped silently.
const RAIL_POSITION = "left-4 md:left-[calc(50%_-_1px)]";

/**
 * Vertical timeline rail. The coloured line fills from top to bottom in step
 * with how far the section has been scrolled through.
 */
export function TimelineTrack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <div ref={ref} className="relative">
      {/* Static rail */}
      <div className={`absolute top-0 bottom-0 w-0.5 bg-border ${RAIL_POSITION}`} />
      {/* Progress fill */}
      <motion.div
        aria-hidden
        style={{ scaleY }}
        className={`absolute top-0 bottom-0 w-0.5 origin-top bg-gradient-to-b from-primary via-primary to-primary/40 ${RAIL_POSITION}`}
      />
      {children}
    </div>
  );
}

/** Dot marker that pops in when its card enters the viewport. */
export function TimelineDot() {
  return (
    <motion.span
      aria-hidden
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
      // The dot is 14px wide, so its left edge sits 7px before the rail's
      // centre line — 17px on mobile (left-4 + half of the 2px rail) and 50%
      // on desktop.
      className="absolute left-[calc(1rem_-_6px)] z-10 mt-2 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.18)] md:left-[calc(50%_-_7px)]"
    />
  );
}
