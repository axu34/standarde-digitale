import type { Metadata } from "next";
import { AuditForm } from "@/components/AuditForm";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Exemplu de raport",
  description: "Cum arată un raport de standarde digitale Dacia, cu dovezi și checklist.",
};

export default function ExempluPage() {
  return (
    <div className="mx-auto max-w-[1216px] px-4 py-16 lg:px-8">
      <p className="font-block text-xs uppercase tracking-[0.2em] text-kaki">
        Exemplu
      </p>
      <h1 className="mt-3 font-block text-4xl font-bold uppercase text-ink">
        Rulați un raport real
      </h1>
      <p className="mt-6 max-w-2xl font-read text-lg leading-relaxed text-ink">
        Cel mai corect exemplu este site-ul vostru, sau unul din referințe. Puteți începe cu
        un site Dacia din rețea — raportul include capturi, grila de 9 criterii și checklist-ul
        de trimis mai departe.
      </p>
      <div className="mt-10 max-w-3xl">
        <AuditForm initialUrl="https://mavexim.ro/dacia-targoviste" />
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {BRAND.portfolio.map((p) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="border border-black/10 p-6 hover:border-kaki"
          >
            <p className="font-block uppercase text-ink">{p.name}</p>
            <p className="mt-2 font-read text-sm text-muted">{p.url}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
