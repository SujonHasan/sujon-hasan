"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ReactNode } from "react";

interface MotionWrapperProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  className?: string;
}

const OFFSET = 40;

const variants: Record<string, Variants> = {
  up: { hidden: { opacity: 0, y: OFFSET }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -OFFSET }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -OFFSET }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: OFFSET }, visible: { opacity: 1, x: 0 } },
};

const staticVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function MotionWrapper({
  children,
  direction = "up",
  delay = 0,
  className,
}: MotionWrapperProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={reduceMotion ? staticVariants : variants[direction]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * `staggerChildren` only takes effect when it lives inside the parent's own
 * variant transition — passing it via the `transition` prop is silently
 * ignored, which is why cards used to animate in all at once.
 */
export function StaggerContainer({
  children,
  className,
  stagger = 0.09,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : stagger,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={
        reduceMotion
          ? staticVariants
          : {
              hidden: { opacity: 0, y: 26, scale: 0.97 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
