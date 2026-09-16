"use client";

import { useEffect } from "react";

export function TrackReport({
  reportId,
  token,
}: {
  reportId: string;
  token?: string;
}) {
  useEffect(() => {
    const m =
      token || new URLSearchParams(window.location.search).get("m") || "";
    void fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, token: m || undefined }),
      keepalive: true,
    }).catch(() => {});
  }, [reportId, token]);
  return null;
}
