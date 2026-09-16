"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReportView } from "@/components/ReportView";
import { TrackReport } from "@/components/TrackReport";
import type { AuditReport } from "@/lib/audit/types";

export function ClientReport({ id, token }: { id: string; token?: string }) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local = sessionStorage.getItem(`report:${id}`);
      if (local) {
        if (!cancelled) {
          setReport(JSON.parse(local) as AuditReport);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) throw new Error("Raportul nu a fost găsit sau a expirat.");
        const data = (await res.json()) as AuditReport;
        if (!cancelled) setReport(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Eroare");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-block text-2xl uppercase text-ink">Raport indisponibil</h1>
        <p className="mt-4 font-read text-ink">{error}</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-[46px] items-center bg-kaki px-6 font-block text-sm uppercase text-white hover:bg-black"
        >
          Verificare nouă
        </Link>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center font-read text-muted">
        Se încarcă raportul…
      </div>
    );
  }

  return (
    <>
      <TrackReport reportId={id} token={token} />
      <ReportView report={report} />
    </>
  );
}
