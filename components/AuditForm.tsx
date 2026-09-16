"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditReport, ProgressEvent } from "@/lib/audit/types";

const STEPS = [
  "Deschid pagina",
  "Caut pagina Dacia",
  "Citesc site-ul",
  "Fac capturile",
  "Notez grila",
  "Salvez raportul",
];

async function readSse(
  res: Response,
  onEvent: (e: ProgressEvent) => void,
): Promise<void> {
  if (!res.body) throw new Error("Fără răspuns de la server.");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() || "";
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      onEvent(JSON.parse(line.slice(6)) as ProgressEvent);
    }
  }
}

export function AuditForm({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  const progressWidth = useMemo(() => `${((stepIndex + 1) / STEPS.length) * 100}%`, [stepIndex]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setStepIndex(0);
    setMessage("Pornesc…");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Verificarea a eșuat.");
      }
      if (!res.ok) throw new Error("Verificarea a eșuat.");

      let report: AuditReport | null = null;
      let id: string | null = null;
      await readSse(res, (event) => {
        if (event.type === "progress") {
          setMessage(event.message);
          setStepIndex((prev) => {
            if (event.step === "goto") return 0;
            if (event.step === "discover") return 1;
            if (event.step === "snapshot") return 2;
            if (event.step === "desktop" || event.step === "mobile") return 3;
            if (event.step === "score" || event.step === "favicon") return 4;
            if (event.step === "save") return 5;
            return prev;
          });
        }
        if (event.type === "error") {
          throw new Error(event.message);
        }
        if (event.type === "done") {
          report = event.report;
          id = event.id;
        }
      });
      if (!report || !id) throw new Error("Raportul nu a fost generat.");
      sessionStorage.setItem(`report:${id}`, JSON.stringify(report));
      router.push(`/raport/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare neașteptată.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor="site-url" className="font-block text-sm uppercase tracking-[0.16em] text-ink">
        Adresa site-ului
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="site-url"
          name="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://agent.ro sau /dacia-oras"
          className="h-[52px] w-full flex-1 rounded-none border border-ink bg-white px-4 font-read text-lg text-ink outline-none placeholder:text-muted focus:border-kaki"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="h-[52px] min-w-[200px] rounded-none bg-kaki px-8 font-block text-base font-bold uppercase text-white hover:bg-black disabled:bg-disabled disabled:text-ink"
        >
          {busy ? "Se verifică…" : "Verifică"}
        </button>
      </div>
      {busy ? (
        <div className="mt-10">
          <div className="h-px w-full bg-disabled">
            <div className="h-px bg-kaki transition-all" style={{ width: progressWidth }} />
          </div>
          <p className="mt-5 font-block text-sm uppercase tracking-[0.16em] text-ink">
            {STEPS[stepIndex]}
          </p>
          <p className="mt-2 font-read text-sm text-muted">{message}</p>
        </div>
      ) : null}
      {error ? (
        <p className="mt-5 font-read text-sm text-terracotta" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
