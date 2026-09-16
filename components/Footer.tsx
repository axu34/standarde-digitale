import { BRAND, DISCLAIMER } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="bg-kaki text-white">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-12 px-4 py-16 sm:flex-row sm:justify-between lg:px-8">
        <div>
          <p className="font-block text-sm font-bold uppercase tracking-wide">
            Standarde digitale
          </p>
          <p className="mt-4 max-w-xs font-read text-sm leading-relaxed text-white/80">
            Verificare independentă a site-urilor Dacia de agent.
          </p>
        </div>
        <div className="font-read text-sm leading-relaxed text-white/80">
          <p className="font-block text-sm font-bold uppercase tracking-wide text-white">
            {BRAND.agency}
          </p>
          <p className="mt-4">
            <a className="hover:underline" href={`tel:${BRAND.phoneTel}`}>
              {BRAND.phoneDisplay}
            </a>
            <br />
            <a className="hover:underline" href={`mailto:${BRAND.email}`}>
              {BRAND.email}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-[1080px] px-4 py-6 font-read text-xs leading-relaxed text-white/70 lg:px-8">
          {DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
