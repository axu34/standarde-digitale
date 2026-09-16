import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Metodologie",
  description:
    "Cum notăm cele 9 criterii de conformitate website Dacia 2026 și verificările de calitate pentru un site de dealer.",
};

const tnp = [
  {
    n: "03",
    t: "URL & favicon",
    d: "URL-ul trebuie să conțină Dacia și, ideal, orașul (path sau subdomeniu). Favicon: emblemă albă pe kaki #646B52.",
  },
  {
    n: "04",
    t: "Layout & UX",
    d: "Pe homepage-ul Dacia: navigare fundal alb, banner, gamă vehicule noi, listă servicii. Fără CTA-uri către alte mărci pe această pagină. Homepage-ul multi-brand al agentului este permis și nu se depunctează.",
  },
  {
    n: "05",
    t: "Logo agent",
    d: "În dreapta headerului. Click → Despre noi, tab nou. Pagina despre noi rămâne în standardele Dacia, fără promovarea altor mărci.",
  },
  {
    n: "06",
    t: "Culori",
    d: "Kaki #646B52, orange #EC6528, terracotta #B9412D, text #333 / #777, fundal alb. Griul #F3F4F6 pe secțiuni a picat auditul H1. Footer kaki.",
  },
  {
    n: "07",
    t: "Tipografie",
    d: "Dacia Block pe titluri, meniu, CTA. Read pe body. Un singur font = Block.",
  },
  {
    n: "08",
    t: "UI",
    d: "Icoane din setul Renault Group. CTA colțuri drepte, 46px, hover negru. Culori de buton din paletă.",
  },
  {
    n: "09",
    t: "Gama",
    d: "Packshot ¾, același unghi, fundal alb. Ordine notată în RO: de la cel mai mic la cel mai mare (Spring → Bigster), nu «cel mai nou primul».",
  },
  {
    n: "10",
    t: "Preț de pornire",
    d: "Pe fiecare model cu preț public. Fără preț tăiat. Noul Spring și Striker pot lipsi dacă lipsesc și pe catalogul național.",
  },
  {
    n: "11",
    t: "Oferte & servicii",
    d: "Servicii cu orar, inclusiv Vânzări mașini noi. Lipsa orarului a fost PARTIAL (50%) în H1.",
  },
];

export default function MetodologiePage() {
  return (
    <div className="mx-auto max-w-[1216px] px-4 py-16 lg:px-8">
      <p className="font-block text-xs uppercase tracking-[0.2em] text-kaki">
        Cum notăm
      </p>
      <h1 className="mt-3 font-block text-4xl font-bold uppercase text-ink">Metodologie</h1>
      <p className="mt-6 max-w-3xl font-read text-lg leading-relaxed text-ink">
        Scorul «Website conformity» este media a 9 criterii, fiecare 100% (OK), 50%
        (parțial) sau 0% (KO) — același model ca în rapoartele de rețea. Calitatea 2026 este
        un al doilea scor, separat, ca să nu amestecăm grila producătorului cu bunele
        practici de dealer.
      </p>
      <p className="mt-4 max-w-3xl font-read text-sm leading-relaxed text-muted">
        Sursă: Ghid standarde digitale Dacia 2026 (19 martie) și grila de audit website.
        La conflict între slide-uri și ce se notează efectiv, urmăm ce se notează (ordine
        mic → mare, fundal alb, fără gri de secțiune).
      </p>

      <ol className="mt-12 space-y-8">
        {tnp.map((c) => (
          <li key={c.n} className="grid gap-3 border-t border-black/10 pt-8 md:grid-cols-[80px_1fr]">
            <p className="font-block text-2xl text-kaki">{c.n}</p>
            <div>
              <h2 className="font-block text-xl uppercase text-ink">{c.t}</h2>
              <p className="mt-2 font-read text-base leading-relaxed text-ink">{c.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-16 font-block text-2xl font-bold uppercase text-ink">
        Calitate dealer 2026
      </h2>
      <p className="mt-4 max-w-3xl font-read text-base leading-relaxed text-ink">
        Un site de agent în 2026 este mobil-first: LCP sub 2,5s, click-to-call, orar și
        telefon pe homepage, formulare scurte cu notă GDPR, schema AutoDealer, imagini
        optimizate, EAA (heading, alt, lang). Astea nu înlocuiesc grila Dacia — arată dacă
        site-ul chiar aduce clienți în showroom.
      </p>

      <h2 className="mt-16 font-block text-2xl font-bold uppercase text-ink">Limite</h2>
      <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 font-read text-base text-ink">
        <li>Nu verificăm Google Business Profile (se notează separat, 100% la mulți agenți).</li>
        <li>Nu înlocuim auditorul. Un gri de hover sau un font servit sub nume intern poate arăta altfel la om.</li>
        <li>Nu atacăm un homepage multi-brand sau un subdomeniu Dacia valid.</li>
        <li>
          Tool-ul este făcut de {BRAND.agency}, pe baza a două site-uri din rețea. Nu suntem
          partener oficial Dacia.
        </li>
      </ul>
    </div>
  );
}
