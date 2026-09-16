"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";
import type { AuditReport, CriterionResult, Verdict } from "@/lib/audit/types";
import { formatRoDate } from "@/lib/utils";
import { IconCheck, IconCancel, IconList, IconPhone } from "./Icons";

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
}: {
  item: CriterionResult;
  report: AuditReport;
}) {
  const shots = item.evidence
    .filter((e) => e.screenshotId)
    .map((e) => shot(report, e.screenshotId))
    .filter(Boolean);

  return (
    <article className="border border-black/10 bg-white print:break-inside-avoid">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
        <div>
          <p className="font-read text-xs uppercase tracking-wide text-muted">
            {item.group === "tnp" ? `Criteriul ${item.number}` : "Calitate 2026"} ·{" "}
            {item.officialName}
          </p>
          <h3 className="mt-1 font-block text-lg font-bold uppercase text-ink">
            {item.title}
          </h3>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 font-block text-sm font-bold ${verdictStyle(item.verdict)}`}>
            {item.verdict}
          </span>
          <p className="mt-1 font-block text-xl text-ink">{item.score}%</p>
        </div>
      </div>
      <div className="grid gap-6 px-5 py-5 lg:grid-cols-2">
        <div>
          <p className="font-read text-base leading-relaxed text-ink">{item.summary}</p>
          <ul className="mt-4 space-y-2 font-read text-sm leading-relaxed text-ink">
            {item.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 bg-kaki" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-l-2 border-kaki pl-3 font-read text-sm text-ink">
            <span className="font-bold">De făcut: </span>
            {item.recommendation}
          </p>
          <div className="mt-4 space-y-2">
            {item.evidence
              .filter((e) => e.kind !== "screenshot")
              .map((e, i) => (
                <div key={`${e.label}-${i}`} className="font-read text-sm">
                  <span className="text-muted">{e.label}: </span>
                  {e.hex ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block size-4 border border-black/20"
                        style={{ background: e.hex }}
                      />
                      <code>{e.hex || e.value}</code>
                    </span>
                  ) : (
                    <span>{e.value || e.quote}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className="space-y-3">
          {shots.map((s) =>
            s ? (
              <figure key={s.id} className="border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.dataUrl} alt={s.label} className="w-full" />
                <figcaption className="bg-white px-3 py-2 font-read text-xs text-muted">
                  {s.label} — dovadă la {item.title}
                </figcaption>
              </figure>
            ) : null,
          )}
        </div>
      </div>
    </article>
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
    `Bună, am verificat ${report.analyzedUrl} — conformitate website ${report.tnpLabel}. Doresc o discuție.`,
  )}`;

  return (
    <aside className="border border-black/10 bg-white p-6 print:hidden">
      <p className="font-block text-sm uppercase tracking-wide text-kaki">
        Următorul pas
      </p>
      <h2 className="mt-2 font-block text-2xl font-bold uppercase text-ink">
        {report.pitch.headline}
      </h2>
      <p className="mt-3 font-read text-base leading-relaxed text-ink">{report.pitch.body}</p>
      <p className="mt-2 font-read text-sm text-muted">{report.pitch.urgency}</p>
      <p className="mt-4 font-read text-sm text-ink">
        Site Dacia gata în {BRAND.delivery}. {BRAND.price}, tot inclus: standarde, conținut,
        SEO, găzduire, prețuri după catalogul public, prezență la meeting-urile digitale.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-[46px] items-center justify-center gap-2 bg-kaki px-5 font-block text-sm font-bold uppercase text-white hover:bg-black"
        >
          <IconPhone size={20} /> WhatsApp
        </a>
        <a
          href={`tel:${BRAND.phoneTel}`}
          className="inline-flex h-[46px] items-center justify-center border border-ink px-5 font-block text-sm font-bold uppercase text-ink hover:bg-black hover:text-white"
        >
          {BRAND.phoneDisplay}
        </a>
      </div>
      {state === "ok" ? (
        <p className="mt-6 font-read text-sm text-kaki">Am primit mesajul. Vă contactăm noi.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input name="name" required placeholder="Nume" className="h-[46px] rounded-[2px] border border-black/20 px-3 font-read" />
          <input name="dealer" defaultValue={report.dealerGuess} placeholder="Agent / punct de lucru" className="h-[46px] rounded-[2px] border border-black/20 px-3 font-read" />
          <input name="phone" placeholder="Telefon" className="h-[46px] rounded-[2px] border border-black/20 px-3 font-read" />
          <input name="email" type="email" placeholder="Email" className="h-[46px] rounded-[2px] border border-black/20 px-3 font-read" />
          <textarea name="message" rows={3} placeholder="Mesaj (opțional)" className="rounded-[2px] border border-black/20 px-3 py-2 font-read" />
          <button className="h-[46px] bg-kaki font-block text-sm font-bold uppercase text-white hover:bg-black">
            Trimite-mi oferta
          </button>
          {state === "err" ? <p className="font-read text-sm text-terracotta">{err}</p> : null}
        </form>
      )}
    </aside>
  );
}

export function ReportView({ report }: { report: AuditReport }) {
  const tnp = report.criteria.filter((c) => c.group === "tnp");
  const quality = report.criteria.filter((c) => c.group === "quality");
  const desktop = shot(report, "desktop");
  const mobile = shot(report, "mobile");
  const checklist = report.checklist.join("\n");

  function printReport() {
    window.print();
  }

  function copyChecklist() {
    navigator.clipboard.writeText(
      `Checklist standarde digitale Dacia — ${report.analyzedUrl}\nScor website: ${report.tnpLabel}\n\n${checklist}\n\nAnaliză independentă. Nu este audit oficial.`,
    );
  }

  return (
    <div className="bg-white">
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-[1216px] px-4 py-10 lg:px-8">
          <p className="font-block text-xs uppercase tracking-[0.2em] text-muted">
            Dacia — detailed report · Audit report 2026
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h1 className="font-block text-3xl font-bold uppercase leading-tight text-ink lg:text-5xl">
                Website conformity
              </h1>
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="font-read text-xs uppercase text-muted">Dealer</dt>
                  <dd className="font-block text-lg uppercase text-ink">{report.dealerGuess}</dd>
                </div>
                <div>
                  <dt className="font-read text-xs uppercase text-muted">Locație</dt>
                  <dd className="font-block text-lg uppercase text-ink">{report.cityGuess}</dd>
                </div>
                <div>
                  <dt className="font-read text-xs uppercase text-muted">Data</dt>
                  <dd className="font-block text-lg uppercase text-ink">
                    {formatRoDate(report.createdAt)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 font-read text-sm text-muted">
                Analizat:{" "}
                <a className="text-ink underline" href={report.analyzedUrl} target="_blank" rel="noreferrer">
                  {report.analyzedUrl}
                </a>
              </p>
            </div>
            <div className="flex flex-col items-start justify-end lg:col-span-4 lg:items-end">
              <p className="font-read text-xs uppercase text-muted">Total score</p>
              <p className="font-block text-6xl font-bold text-kaki">{report.tnpLabel}</p>
              <p className="mt-2 font-read text-sm text-muted">
                {report.counts.ok} OK · {report.counts.partial} parțial · {report.counts.ko} KO
                {" "}din 9 criterii website
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={printReport}
              className="h-[46px] bg-kaki px-5 font-block text-sm font-bold uppercase text-white hover:bg-black"
            >
              Salvează PDF
            </button>
            <button
              type="button"
              onClick={copyChecklist}
              className="h-[46px] border border-ink px-5 font-block text-sm font-bold uppercase text-ink hover:bg-black hover:text-white"
            >
              Copiază checklist-ul
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1216px] px-4 py-10 lg:px-8">
        <h2 className="font-block text-2xl font-bold uppercase text-ink">
          Grila website (9 criterii)
        </h2>
        <p className="mt-2 max-w-3xl font-read text-sm text-muted">
          Aceleași capitole ca în raportul de conformitate website: URL și favicon, layout, logo
          agent, culori, tipografie, UI, gamă, preț de pornire, oferte și servicii.
        </p>
        <div className="mt-6 grid gap-px bg-black/10 sm:grid-cols-3">
          {tnp.map((c) => (
            <a
              key={c.id}
              href={`#c-${c.id}`}
              className="flex items-center justify-between bg-white px-4 py-4 hover:bg-white"
            >
              <span className="pr-3 font-read text-sm text-ink">{c.title}</span>
              <span className={`shrink-0 px-2 py-1 font-block text-xs font-bold ${verdictStyle(c.verdict)}`}>
                {c.score}%
              </span>
            </a>
          ))}
        </div>
      </section>

      {(desktop || mobile) && (
        <section className="mx-auto max-w-[1216px] px-4 pb-10 lg:px-8">
          <h2 className="font-block text-2xl font-bold uppercase text-ink">Dovezi vizuale</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {desktop ? (
              <figure className="border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={desktop.dataUrl} alt="Captură desktop" className="w-full" />
                <figcaption className="px-3 py-2 font-read text-xs text-muted">
                  Desktop 1440px — {report.analyzedUrl}
                </figcaption>
              </figure>
            ) : null}
            {mobile ? (
              <figure className="border border-black/10 lg:max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mobile.dataUrl} alt="Captură mobil" className="w-full" />
                <figcaption className="px-3 py-2 font-read text-xs text-muted">
                  Mobil 390px
                </figcaption>
              </figure>
            ) : null}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1216px] space-y-6 px-4 pb-12 lg:px-8">
        <h2 className="font-block text-2xl font-bold uppercase text-ink">Answer report</h2>
        {tnp.map((c) => (
          <div key={c.id} id={`c-${c.id}`}>
            <CriterionBlock item={c} report={report} />
          </div>
        ))}
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1216px] px-4 py-12 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-block text-xs uppercase tracking-[0.2em] text-muted">
                În afara grilei de audit
              </p>
              <h2 className="mt-2 font-block text-2xl font-bold uppercase text-ink">
                Calitate dealer 2026
              </h2>
              <p className="mt-2 max-w-2xl font-read text-sm text-muted">
                Mobil, viteză, SEO local, GDPR, EAA, click-to-call. Nu apar pe foaia TNP, dar
                decid dacă un client rămâne pe site sau sună la alt agent.
              </p>
            </div>
            <p className="font-block text-4xl text-kaki">{report.qualityLabel}</p>
          </div>
          <div className="mt-8 space-y-6">
            {quality.map((c) => (
              <CriterionBlock key={c.id} item={c} report={report} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1216px] gap-8 px-4 py-12 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-3">
          <h2 className="flex items-center gap-2 font-block text-2xl font-bold uppercase text-ink">
            <IconList /> Checklist pentru agenția actuală
          </h2>
          <p className="mt-3 font-read text-sm leading-relaxed text-ink">
            Dacă lucrați deja cu cineva pe site, trimiteți-le lista de mai jos. Este limba
            auditului, nu a unei oferte. Dacă nu o pot închide până în {BRAND.nextAudit}, putem
            prelua noi.
          </p>
          <ol className="mt-6 space-y-3">
            {report.checklist.length ? (
              report.checklist.map((line, i) => (
                <li key={line} className="flex gap-3 border border-black/10 p-4 font-read text-sm">
                  <span className="font-block text-kaki">{String(i + 1).padStart(2, "0")}</span>
                  <span>{line}</span>
                </li>
              ))
            ) : (
              <li className="flex gap-2 font-read text-sm text-ink">
                <IconCheck className="text-kaki" /> Nimic de corectat pe criteriile verificate.
              </li>
            )}
          </ol>
          <div className="mt-8 border border-black/10 p-5">
            <p className="font-block text-sm uppercase text-ink">Site-uri de referință</p>
            <ul className="mt-3 space-y-2 font-read text-sm">
              {BRAND.portfolio.map((p) => (
                <li key={p.url}>
                  <a className="text-kaki underline" href={p.url} target="_blank" rel="noreferrer">
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {report.engine.warnings.length ? (
            <p className="mt-4 font-read text-xs text-muted">{report.engine.warnings.join(" ")}</p>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <LeadCard report={report} />
        </div>
      </section>
    </div>
  );
}

export function VerdictIcon({ v }: { v: Verdict }) {
  return v === "KO" ? <IconCancel /> : <IconCheck />;
}
