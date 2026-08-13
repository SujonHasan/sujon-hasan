"use client";

import { MouseEvent, ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that feeds the cursor position to the `.spotlight-card` CSS
 * gradient, so a soft highlight follows the mouse across the card.
 */
export function Spotlight({ children, className }: SpotlightProps) {
  const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
  }, []);

  return (
    <div onMouseMove={handleMouseMove} className={cn("spotlight-card", className)}>
      {children}
    </div>
  );
}
