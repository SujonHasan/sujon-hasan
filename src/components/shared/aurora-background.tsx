"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

/**
 * Decorative layer for the hero: a faded grid, two slow colour washes, and a
 * soft light that follows the pointer across the section.
 *
 * Deliberately restrained — no discrete objects, nothing that reads as
 * "moving parts". Purely visual, so it is hidden from assistive tech.
 */
export function AuroraBackground() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Pointer position in section-local pixels. Starts off-canvas so the light
  // only appears once the visitor actually moves the mouse.
  const pointerX = useMotionValue(-600);
  const pointerY = useMotionValue(-600);
  const lightX = useSpring(pointerX, { stiffness: 55, damping: 20, mass: 0.6 });
  const lightY = useSpring(pointerY, { stiffness: 55, damping: 20, mass: 0.6 });

  const light = useMotionTemplate`radial-gradient(460px circle at ${lightX}px ${lightY}px, hsl(var(--primary) / 0.16), transparent 68%)`;

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    // Measuring inside the mousemove handler would force a synchronous layout
    // on every single event. The section only moves on scroll or resize, so
    // cache its box and refresh it from those instead.
    let bounds = ref.current?.getBoundingClientRect() ?? null;
    let measureFrame = 0;

    const remeasure = () => {
      measureFrame = 0;
      bounds = ref.current?.getBoundingClientRect() ?? null;
    };

    const scheduleRemeasure = () => {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(remeasure);
    };

    const handleMove = (event: MouseEvent) => {
      if (!bounds) return;
      pointerX.set(event.clientX - bounds.left);
      pointerY.set(event.clientY - bounds.top);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("scroll", scheduleRemeasure, { passive: true });
    window.addEventListener("resize", scheduleRemeasure, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("scroll", scheduleRemeasure);
      window.removeEventListener("resize", scheduleRemeasure);
      if (measureFrame) cancelAnimationFrame(measureFrame);
    };
  }, [pointerX, pointerY, reduceMotion]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 hero-grid" />

      <div
        className="aurora-blob h-[42rem] w-[42rem] -left-52 -top-52"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
          animationDuration: "26s",
        }}
      />
      <div
        className="aurora-blob h-[36rem] w-[36rem] -right-40 top-24"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.22), transparent 70%)",
          animationDelay: "-11s",
          animationDuration: "32s",
        }}
      />

      {/* Pointer light */}
      {!reduceMotion && (
        <motion.div className="absolute inset-0" style={{ background: light }} />
      )}

      {/* Fade the whole thing into the page background at the bottom edge. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
