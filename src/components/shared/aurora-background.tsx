"use client";

/**
 * Decorative layer for the hero: a faded grid plus three slow-drifting colour
 * blobs. Purely visual, so it is hidden from assistive tech.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 hero-grid" />

      <div
        className="aurora-blob h-[38rem] w-[38rem] -left-40 -top-40"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.55), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob h-[32rem] w-[32rem] -right-32 top-10"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.32), transparent 70%)",
          animationDelay: "-6s",
          animationDuration: "22s",
        }}
      />
      <div
        className="aurora-blob h-[30rem] w-[30rem] bottom-[-10rem] left-1/3"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--foreground) / 0.14), transparent 70%)",
          animationDelay: "-12s",
          animationDuration: "26s",
        }}
      />

      {/* Fade the whole thing into the page background at the bottom edge. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
