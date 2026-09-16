import { BRAND, DISCLAIMER } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="bg-kaki text-white">
      <div className="mx-auto grid max-w-[1216px] gap-10 px-4 py-14 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-block text-sm font-bold uppercase tracking-wide">
            Standarde digitale
          </p>
          <p className="mt-3 max-w-sm font-read text-sm leading-relaxed text-white/85">
            Verificare independentă a site-urilor de agenți Dacia, pe grila de
            conformitate website 2026.
          </p>
        </div>
        <div className="font-read text-sm leading-relaxed text-white/85">
          <p className="font-block text-sm font-bold uppercase tracking-wide text-white">
            {BRAND.agency}
          </p>
          <p className="mt-3">
            <a className="underline-offset-2 hover:underline" href={`tel:${BRAND.phoneTel}`}>
              {BRAND.phoneDisplay}
            </a>
            <br />
            <a className="underline-offset-2 hover:underline" href={`mailto:${BRAND.email}`}>
              {BRAND.email}
            </a>
            <br />
            <a
              className="underline-offset-2 hover:underline"
              href={BRAND.agencyUrl}
              target="_blank"
              rel="noreferrer"
            >
              www.vreau-site.ro
            </a>
          </p>
        </div>
        <div className="font-read text-sm leading-relaxed text-white/85">
          <p className="font-block text-sm font-bold uppercase tracking-wide text-white">
            Referințe
          </p>
          <ul className="mt-3 space-y-2">
            {BRAND.portfolio.map((p) => (
              <li key={p.url}>
                <a
                  className="underline-offset-2 hover:underline"
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
      </div>
      <div className="border-t border-white/20">
        <p className="mx-auto max-w-[1216px] px-4 py-6 font-read text-xs leading-relaxed text-white/80 lg:px-8">
          {DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
