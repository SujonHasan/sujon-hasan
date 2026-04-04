"use client";

import { useEffect } from "react";

export function AnalyticsTracker({ page }: { page: string }) {
  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    }).catch(() => {});
  }, [page]);

  return null;
}
