import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cum notăm",
  description:
    "Cele 9 criterii de website Dacia 2026: OK, parțial sau KO. Analiză independentă.",
};

const tnp = [
  {
    n: "03",
    t: "URL și favicon",
    d: "Adresa conține Dacia și orașul. Favicon: emblemă albă pe kaki.",
  },
  {
    n: "04",
    t: "Layout",
    d: "Pe pagina Dacia: header alb, banner, gamă, servicii. Fără alte mărci aici. Homepage-ul multi-brand al agentului este permis.",
  },
  {
    n: "05",
    t: "Logo agent",
    d: "În dreapta. Click spre Despre noi, tab nou.",
  },
  {
    n: "06",
    t: "Culori",
    d: "Kaki, orange, terracotta, text închis, fundal alb. Fără gri de secțiune. Footer kaki.",
  },
  {
    n: "07",
    t: "Fonturi",
    d: "Dacia Block pe titluri, meniu, butoane. Read pe text. Un singur font = Block.",
  },
  {
    n: "08",
    t: "Butoane",
    d: "Colțuri drepte, icoane din setul Renault Group, culori din paletă.",
  },
  {
    n: "09",
    t: "Gama",
    d: "Doar Dacia, același unghi, de la mic la mare.",
  },
  {
    n: "10",
    t: "Prețuri",
    d: "Preț de pornire pe fiecare model cu preț public. Fără preț tăiat.",
  },
  {
    n: "11",
    t: "Servicii",
    d: "Listă cu orar, inclusiv vânzări de mașini noi.",
  },
];

export default function MetodologiePage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-20 lg:px-8 lg:py-28">
      <p className="font-block text-xs uppercase tracking-[0.28em] text-kaki">Grila</p>
      <h1 className="mt-5 font-block text-4xl font-bold uppercase leading-tight text-ink lg:text-5xl">
        Cum notăm
      </h1>
      <p className="mt-8 font-read text-xl leading-relaxed text-ink">
        Scorul este media a 9 criterii: 100, 50 sau 0. Același model ca în raportul de
        rețea. Calitatea 2026 (mobil, SEO, GDPR) stă separat — nu umflă și nu scade grila
        producătorului.
      </p>

      <ol className="mt-20 space-y-12">
        {tnp.map((c) => (
          <li key={c.n}>
            <p className="font-block text-xs uppercase tracking-[0.2em] text-kaki">{c.n}</p>
            <h2 className="mt-2 font-block text-2xl uppercase text-ink">{c.t}</h2>
            <p className="mt-3 font-read text-lg leading-relaxed text-ink">{c.d}</p>
          </li>
        ))}
      </ol>

      <p className="mt-24 font-read text-base leading-relaxed text-muted">
        Nu înlocuim auditorul. Un font servit sub nume intern sau un gri de hover poate
        arăta altfel la om. Tool-ul e făcut de {BRAND.agency}, pe două site-uri din rețea.
      </p>
    </div>
  );
}
