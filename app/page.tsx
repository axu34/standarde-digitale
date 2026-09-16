import { AuditForm } from "@/components/AuditForm";
import { BRAND } from "@/lib/brand";
import { IconCar, IconCheck, IconClock, IconDealer, IconList } from "@/components/Icons";

const criteria = [
  "URL & favicon Dacia",
  "Layout homepage",
  "Logo agent (tab nou)",
  "Culori (fără gri)",
  "Fonturi Block / Read",
  "Butoane colțuri drepte",
  "Gamă mic → mare",
  "Preț de pornire",
  "Servicii + orar",
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1216px] gap-12 px-4 py-16 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-7">
            <p className="font-block text-xs uppercase tracking-[0.25em] text-kaki">
              Website conformity · 2026
            </p>
            <h1 className="mt-4 font-block text-4xl font-bold uppercase leading-[1.05] text-ink lg:text-6xl">
              Verificare standarde digitale
            </h1>
            <p className="mt-6 max-w-xl font-read text-lg leading-relaxed text-ink">
              Introduceți site-ul Dacia al agentului. În câteva zeci de secunde primiți un
              raport pe grila de website 2026, cu capturi de ecran, culori măsurate și ce
              trece / ce cade.
            </p>
            <p className="mt-4 font-read text-sm text-muted">
              Următorul val de audit: {BRAND.nextAudit}. Analiză independentă, nu este un
              audit oficial Dacia.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-4 lg:col-span-5">
            <div className="border border-black/10 p-6">
              <p className="font-block text-5xl text-kaki">9</p>
              <p className="mt-1 font-read text-sm text-ink">
                criterii de conformitate website — aceleași capitole ca în raportul de rețea
              </p>
            </div>
            <div className="border border-black/10 p-6">
              <p className="font-block text-5xl text-kaki">+10</p>
              <p className="mt-1 font-read text-sm text-ink">
                verificări de calitate 2026: mobil, viteză, SEO, GDPR, click-to-call
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1216px] px-4 py-14 lg:px-8">
          <AuditForm />
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1216px] px-4 py-16 lg:px-8">
          <h2 className="font-block text-2xl font-bold uppercase text-ink">
            Ce se notează pe website
          </h2>
          <ol className="mt-8 grid gap-px bg-black/10 sm:grid-cols-3">
            {criteria.map((c, i) => (
              <li key={c} className="flex items-center gap-3 bg-white px-4 py-4">
                <span className="font-block text-sm text-kaki">{String(i + 3).padStart(2, "0")}</span>
                <span className="font-read text-sm text-ink">{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1216px] gap-10 px-4 py-16 lg:grid-cols-3 lg:px-8">
          <article>
            <IconCar className="text-kaki" />
            <h3 className="mt-4 font-block text-lg font-bold uppercase text-ink">
              Dovezi, nu opinii
            </h3>
            <p className="mt-2 font-read text-sm leading-relaxed text-ink">
              Fiecare criteriu are captură, culoare măsurată, font citit din pagină sau citat
              din text. Puteți trimite raportul mai departe.
            </p>
          </article>
          <article>
            <IconList className="text-kaki" />
            <h3 className="mt-4 font-block text-lg font-bold uppercase text-ink">
              Checklist pentru cine vă ține site-ul
            </h3>
            <p className="mt-2 font-read text-sm leading-relaxed text-ink">
              Dacă aveți deja o agenție, copiați lista de remedieri. Dacă nu o pot închide până
              la audit, preluăm noi.
            </p>
          </article>
          <article>
            <IconDealer className="text-kaki" />
            <h3 className="mt-4 font-block text-lg font-bold uppercase text-ink">
              Referință din rețea
            </h3>
            <p className="mt-2 font-read text-sm leading-relaxed text-ink">
              Facem site-urile Dacia pentru{" "}
              <a className="underline" href={BRAND.portfolio[0].url}>
                Mavexim Târgoviște
              </a>{" "}
              și{" "}
              <a className="underline" href={BRAND.portfolio[1].url}>
                Grig Auto Drăgășani
              </a>
              . {BRAND.price}, gata în {BRAND.delivery}.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-[1216px] px-4 py-16 lg:px-8">
          <h2 className="font-block text-2xl font-bold uppercase text-ink">Cum funcționează</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            <li>
              <p className="font-block text-3xl text-kaki">01</p>
              <p className="mt-2 font-block uppercase text-ink">Lipiți URL-ul</p>
              <p className="mt-2 font-read text-sm text-ink">
                Homepage sau pagina Dacia. Dacă există un path /dacia-oraș, îl găsim.
              </p>
            </li>
            <li>
              <p className="font-block text-3xl text-kaki">02</p>
              <p className="mt-2 font-block uppercase text-ink">Citire ca un auditor</p>
              <p className="mt-2 font-read text-sm text-ink">
                Desktop + mobil, favicon kaki, butoane, ordine gamă, prețuri, orar, cookies.
              </p>
            </li>
            <li>
              <p className="font-block text-3xl text-kaki">03</p>
              <p className="mt-2 font-block uppercase text-ink">Raport de trimis</p>
              <p className="mt-2 font-read text-sm text-ink">
                PDF, checklist, link. Opțional, vorbim 15 minute despre ce trebuie schimbat.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1216px] flex-col items-start justify-between gap-6 px-4 py-16 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="flex items-center gap-2 font-block text-sm uppercase text-kaki">
              <IconClock /> {BRAND.nextAudit}
            </p>
            <h2 className="mt-2 font-block text-2xl font-bold uppercase text-ink">
              Nu așteptați foaia de punctaj
            </h2>
            <p className="mt-2 max-w-xl font-read text-sm text-ink">
              În H1, același șablon a luat 72,7% pe website pentru culori, butoane și orar.
              Lucrurile astea se văd din afară — le măsurăm acum.
            </p>
          </div>
          <a
            href="#site-url"
            className="inline-flex h-[46px] items-center gap-2 bg-kaki px-6 font-block text-sm font-bold uppercase text-white hover:bg-black"
          >
            <IconCheck size={20} /> Verifică un site
          </a>
        </div>
      </section>
    </>
  );
}
