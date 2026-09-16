"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";
import type { AuditReport, CriterionResult, Verdict } from "@/lib/audit/types";
import { formatRoDate } from "@/lib/utils";
import { IconPhone } from "./Icons";

function verdictStyle(v: Verdict) {
  if (v === "OK") return "bg-kaki text-white";
  if (v === "PARTIAL") return "bg-orange text-white";
  return "bg-terracotta text-white";
}

function shot(report: AuditReport, id?: string) {
  return report.screenshots.find((s) => s.id === id);
}

function CriterionBlock({
  item,
  report,
  open,
}: {
  item: CriterionResult;
  report: AuditReport;
  open: boolean;
}) {
  const shots = item.evidence
    .filter((e) => e.screenshotId)
    .map((e) => shot(report, e.screenshotId))
    .filter(Boolean);

  return (
    <details
      open={open}
      className="border-t border-black/10 py-8"
      id={`c-${item.id}`}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-block text-xs uppercase tracking-[0.18em] text-muted">
            {item.group === "tnp" ? item.number.toString().padStart(2, "0") : "2026"} ·{" "}
            {item.title}
          </p>
          <p className="mt-2 max-w-2xl font-read text-lg leading-relaxed text-ink">
            {item.summary}
          </p>
        </div>
        <span className={`px-3 py-1 font-block text-sm font-bold ${verdictStyle(item.verdict)}`}>
          {item.verdict}
        </span>
      </summary>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <ul className="space-y-3 font-read text-base leading-relaxed text-ink">
            {item.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {item.verdict !== "OK" ? (
            <p className="mt-6 border-l-2 border-kaki pl-4 font-read text-base text-ink">
              {item.recommendation}
            </p>
          ) : null}
          <div className="mt-6 space-y-2">
            {item.evidence
              .filter((e) => e.kind !== "screenshot")
              .map((e, i) => (
                <div key={`${e.label}-${i}`} className="font-read text-sm text-muted">
                  {e.label}:{" "}
                  {e.hex ? (
                    <span className="inline-flex items-center gap-2 text-ink">
                      <span
                        className="inline-block size-3 border border-black/20"
                        style={{ background: e.hex }}
                      />
                      <span>{e.hex || e.value}</span>
                    </span>
                  ) : (
                    <span className="text-ink">{e.value || e.quote}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className="space-y-4">
          {shots.map((s) =>
            s ? (
              <figure key={s.id} className="border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.dataUrl} alt={s.label} className="w-full" />
                <figcaption className="px-3 py-2 font-read text-xs text-muted">
                  {s.label}
                </figcaption>
              </figure>
            ) : null,
          )}
        </div>
      </div>
    </details>
  );
}

export function LeadCard({ report }: { report: AuditReport }) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        dealer: fd.get("dealer"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        message: fd.get("message"),
        reportId: report.id,
        score: report.tnpLabel,
        url: report.analyzedUrl,
        city: report.cityGuess,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error || "Nu am putut trimite.");
      setState("err");
      return;
    }
    setState("ok");
  }

  const wa = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
    `Bună, am verificat ${report.analyzedUrl} — ${report.tnpLabel}. Doresc o discuție.`,
  )}`;

  return (
    <aside className="print:hidden">
      <p className="font-block text-xs uppercase tracking-[0.28em] text-kaki">
        {BRAND.agency}
      </p>
      <h2 className="mt-4 font-block text-3xl font-bold uppercase leading-tight text-ink">
        {report.pitch.headline}
      </h2>
      <p className="mt-5 font-read text-lg leading-relaxed text-ink">{report.pitch.body}</p>
      <ol className="mt-8 space-y-3 font-read text-sm leading-relaxed text-ink">
        {BRAND.offer.map((line) => (
          <li key={line} className="border-t border-black/10 pt-3 first:border-0 first:pt-0">
            {line}
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-[52px] items-center justify-center gap-2 bg-kaki px-6 font-block text-sm font-bold uppercase text-white hover:bg-black"
        >
          <IconPhone size={20} /> WhatsApp
        </a>
        <a
          href={`tel:${BRAND.phoneTel}`}
          className="inline-flex h-[52px] items-center justify-center border border-ink px-6 font-block text-sm font-bold uppercase text-ink hover:bg-black hover:text-white"
        >
          {BRAND.phoneDisplay}
        </a>
      </div>
      {state === "ok" ? (
        <p className="mt-8 font-read text-base text-kaki">
          Am primit. Vă contactăm noi. Dacă ați lăsat email, v-am trimis și linkul raportului.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 grid gap-3">
          <input
            name="name"
            required
            placeholder="Nume"
            className="h-[52px] rounded-none border border-black/20 px-4 font-read"
          />
          <input
            name="dealer"
            defaultValue={report.dealerGuess}
            placeholder="Agent / punct de lucru"
            className="h-[52px] rounded-none border border-black/20 px-4 font-read"
          />
          <input
            name="phone"
            placeholder="Telefon"
            className="h-[52px] rounded-none border border-black/20 px-4 font-read"
          />
          <input
            name="email"
            type="email"
            placeholder="Email — vă trimitem raportul"
            className="h-[52px] rounded-none border border-black/20 px-4 font-read"
          />
          <textarea
            name="message"
            rows={3}
            placeholder="Mesaj (opțional)"
            className="rounded-none border border-black/20 px-4 py-3 font-read"
          />
          <button className="h-[52px] bg-kaki font-block text-sm font-bold uppercase text-white hover:bg-black">
            Trimite-mi oferta
          </button>
          {state === "err" ? <p className="font-read text-sm text-terracotta">{err}</p> : null}
        </form>
      )}
    </aside>
  );
}

export function ReportView({ report }: { report: AuditReport }) {
  const [copied, setCopied] = useState<"checklist" | "link" | "">("");
  const tnp = report.criteria.filter((c) => c.group === "tnp");
  const quality = report.criteria.filter((c) => c.group === "quality");
  const desktop = shot(report, "desktop");
  const mobile = shot(report, "mobile");
  const failing = report.brief?.failing ?? report.criteria.filter((c) => c.verdict !== "OK").map((c) => ({
    title: c.title,
    line: c.summary,
    verdict: c.verdict,
  }));
  const passing = report.brief?.passing ?? report.criteria.filter((c) => c.verdict === "OK").map((c) => c.title);
  const checklist = report.checklist.join("\n");

  function copyChecklist() {
    navigator.clipboard.writeText(
      `Checklist site Dacia — ${report.analyzedUrl}\nScor: ${report.tnpLabel}\n\n${checklist}\n\nAnaliză independentă. Nu este audit oficial.`,
    );
    setCopied("checklist");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied("link");
  }

  return (
    <div className="bg-white">
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-[1080px] px-4 py-16 lg:px-8 lg:py-20">
          <p className="font-block text-xs uppercase tracking-[0.28em] text-muted">
            Raport website · 2026
          </p>
          <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-block text-4xl font-bold uppercase leading-[0.95] text-ink lg:text-6xl">
                {report.dealerGuess}
              </h1>
              <p className="mt-4 font-block text-lg uppercase tracking-wide text-ink">
                {report.cityGuess}
                <span className="mx-3 text-muted">·</span>
                {formatRoDate(report.createdAt)}
              </p>
              <p className="mt-4 font-read text-sm text-muted">
                <a className="text-ink underline" href={report.analyzedUrl} target="_blank" rel="noreferrer">
                  {report.analyzedUrl}
                </a>
              </p>
            </div>
            <div>
              <p className="font-read text-xs uppercase tracking-[0.2em] text-muted">Website</p>
              <p className="font-block text-7xl font-bold leading-none text-kaki">{report.tnpLabel}</p>
              <p className="mt-3 font-read text-sm text-muted">
                {report.counts.ok} ok · {report.counts.partial} parțial · {report.counts.ko} ko
              </p>
              {report.engine.review?.applied ? (
                <p className="mt-2 font-read text-xs text-muted">
                  Inclusiv verificare vizuală pe capturi.
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-[52px] bg-kaki px-6 font-block text-sm font-bold uppercase text-white hover:bg-black"
            >
              Salvează PDF
            </button>
            <button
              type="button"
              onClick={copyChecklist}
              className="h-[52px] border border-ink px-6 font-block text-sm font-bold uppercase text-ink hover:bg-black hover:text-white"
            >
              {copied === "checklist" ? "Copiat" : "Checklist"}
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="h-[52px] border border-ink px-6 font-block text-sm font-bold uppercase text-ink hover:bg-black hover:text-white"
            >
              {copied === "link" ? "Copiat" : "Copiază linkul"}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 py-16 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-block text-2xl font-bold uppercase text-ink">Ce cade</h2>
            {failing.length ? (
              <ul className="mt-8 space-y-6">
                {failing.map((f) => (
                  <li key={f.title} className="border-t border-black/10 pt-6">
                    <span
                      className={`mr-3 inline-block px-2 py-0.5 font-block text-xs font-bold ${verdictStyle(f.verdict)}`}
                    >
                      {f.verdict}
                    </span>
                    <span className="font-block uppercase text-ink">{f.title}</span>
                    <p className="mt-3 font-read text-base leading-relaxed text-ink">{f.line}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 font-read text-lg text-ink">Nimic de corectat pe criteriile verificate.</p>
            )}
          </div>
          <div className="lg:col-span-5">
            <h2 className="font-block text-2xl font-bold uppercase text-ink">Ce trece</h2>
            <p className="mt-8 font-read text-base leading-relaxed text-ink">
              {passing.length ? passing.join(" · ") : "—"}
            </p>
            <p className="mt-10 font-block text-xs uppercase tracking-[0.2em] text-muted">
              Calitate 2026 · {report.qualityLabel}
            </p>
            <p className="mt-3 font-read text-sm text-muted">
              Mobil, HTTPS, contact, SEO, GDPR — în afara grilei de audit.
            </p>
          </div>
        </div>
      </section>

      {(desktop || mobile) && (
        <section className="mx-auto max-w-[1080px] px-4 pb-8 lg:px-8">
          <h2 className="font-block text-2xl font-bold uppercase text-ink">Dovezi</h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {desktop ? (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={desktop.dataUrl} alt="Desktop" className="w-full border border-black/10" />
                <figcaption className="mt-3 font-read text-xs text-muted">Desktop</figcaption>
              </figure>
            ) : null}
            {mobile ? (
              <figure className="lg:max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mobile.dataUrl} alt="Mobil" className="w-full border border-black/10" />
                <figcaption className="mt-3 font-read text-xs text-muted">Mobil</figcaption>
              </figure>
            ) : null}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1080px] px-4 py-12 lg:px-8">
        <h2 className="font-block text-2xl font-bold uppercase text-ink">Grila, criteriu cu criteriu</h2>
        <div className="mt-4">
          {tnp.map((c) => (
            <CriterionBlock key={c.id} item={c} report={report} open={c.verdict !== "OK"} />
          ))}
        </div>
        <h2 className="mt-16 font-block text-2xl font-bold uppercase text-ink">
          Calitate dealer 2026
        </h2>
        <div className="mt-4">
          {quality.map((c) => (
            <CriterionBlock key={c.id} item={c} report={report} open={c.verdict !== "OK"} />
          ))}
        </div>
      </section>

      <section className="border-t border-black/10">
        <div className="mx-auto grid max-w-[1080px] gap-16 px-4 py-20 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <h2 className="font-block text-2xl font-bold uppercase text-ink">
              Pentru cine vă ține site-ul
            </h2>
            <p className="mt-4 font-read text-base leading-relaxed text-ink">
              Copiați lista. Dacă nu se închide până în {BRAND.nextAudit}, vorbim noi.
            </p>
            <ol className="mt-8 space-y-4">
              {report.checklist.length ? (
                report.checklist.map((line, i) => (
                  <li key={line} className="flex gap-4 font-read text-sm leading-relaxed">
                    <span className="font-block text-kaki">{String(i + 1).padStart(2, "0")}</span>
                    <span>{line.replace(/^\[(KO|PARTIAL)\]\s/, "")}</span>
                  </li>
                ))
              ) : (
                <li className="font-read text-sm">Nimic pe lista de remedieri.</li>
              )}
            </ol>
            {report.engine.warnings.length ? (
              <p className="mt-6 font-read text-xs text-muted">{report.engine.warnings.join(" ")}</p>
            ) : null}
          </div>
          <div className="lg:col-span-7">
            <LeadCard report={report} />
          </div>
        </div>
      </section>
    </div>
  );
}
