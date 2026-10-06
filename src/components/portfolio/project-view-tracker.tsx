"use client";

import { useEffect } from "react";

/**
 * Counts a project view from the browser rather than during the server render,
 * so link prefetches and crawlers rendering the page don't inflate the count.
 * The public GET endpoint increments `views` for unauthenticated requests.
 */
export function ProjectViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    fetch(`/api/projects/${projectId}`).catch(() => {});
  }, [projectId]);

  return null;
}
