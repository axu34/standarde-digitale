import { AuditForm } from "@/components/AuditForm";
import { BRAND } from "@/lib/brand";

const criteria = [
  "URL și favicon",
  "Layout",
  "Logo agent",
  "Culori",
  "Fonturi",
  "Butoane",
  "Gama",
  "Prețuri",
  "Servicii",
];

export default function HomePage() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-[1080px] px-4 pb-8 pt-20 lg:px-8 lg:pt-28">
          <p className="font-block text-xs uppercase tracking-[0.28em] text-kaki">
            Website · {BRAND.nextAudit}
          </p>
          <h1 className="mt-6 max-w-4xl font-block text-[2.75rem] font-bold uppercase leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
            Trece site-ul Dacia auditul?
          </h1>
          <p className="mt-8 max-w-xl font-read text-xl leading-relaxed text-ink">
            Lipiți adresa. Primiți un raport cu ce cade, ce trece, și ce trebuie schimbat —
            de trimis mai departe.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1080px] px-4 pb-20 lg:px-8">
          <AuditForm />
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1080px] px-4 py-20 lg:px-8">
          <p className="font-block text-xs uppercase tracking-[0.28em] text-muted">
            9 criterii · aceeași grilă de website
          </p>
          <ol className="mt-10 grid gap-x-12 gap-y-5 sm:grid-cols-3">
            {criteria.map((c, i) => (
              <li key={c} className="flex items-baseline gap-4">
                <span className="font-block text-sm text-kaki">
                  {String(i + 3).padStart(2, "0")}
                </span>
                <span className="font-read text-lg text-ink">{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1080px] gap-16 px-4 py-24 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <h2 className="font-block text-3xl font-bold uppercase leading-tight text-ink lg:text-4xl">
              Dacă lista e prea lungă pentru cine vă ține site-ul
            </h2>
            <p className="mt-6 font-read text-lg leading-relaxed text-ink">
              Preluăm noi. Un site Dacia, pe punctul vostru de lucru, gata în{" "}
              {BRAND.delivery}. {BRAND.price}.
            </p>
            <a
              href={`tel:${BRAND.phoneTel}`}
              className="mt-10 inline-flex h-[52px] items-center bg-kaki px-8 font-block text-sm font-bold uppercase text-white hover:bg-black"
            >
              {BRAND.phoneDisplay}
            </a>
          </div>
          <ol className="space-y-4 font-read text-base leading-relaxed text-ink lg:col-span-7 lg:pt-2">
            {BRAND.offer.map((line) => (
              <li key={line} className="border-t border-black/10 pt-4 first:border-0 first:pt-0">
                {line}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <p className="font-block text-xs uppercase tracking-[0.28em] text-muted">Referințe</p>
            <ul className="mt-4 space-y-2">
              {BRAND.portfolio.map((p) => (
                <li key={p.url}>
                  <a
                    className="font-block text-lg uppercase text-ink hover:text-kaki"
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="max-w-sm font-read text-sm leading-relaxed text-muted">
            Analiză independentă. Nu este un audit oficial Dacia.
          </p>
        </div>
      </section>
    </>
  );
}
