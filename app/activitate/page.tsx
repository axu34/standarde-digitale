import { cookies } from "next/headers";
import { listActivity } from "@/lib/track";

export const dynamic = "force-dynamic";

function authorized(value: string | undefined): boolean {
  const key = process.env.ACTIVITY_KEY;
  return Boolean(key && value && value === key);
}

export default async function ActivitatePage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; minted?: string }>;
}) {
  const key = process.env.ACTIVITY_KEY;
  const sp = await searchParams;
  const jar = await cookies();
  const ok = authorized(jar.get("sd_activity")?.value);

  if (!key) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <h1 className="font-block text-2xl uppercase text-ink">Activitate</h1>
        <p className="mt-4 font-read text-ink">
          Setați ACTIVITY_KEY în Vercel ca să vedeți cine a deschis rapoartele din mail.
        </p>
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <h1 className="font-block text-2xl uppercase text-ink">Activitate</h1>
        <p className="mt-4 font-read text-ink">
          Inbox intern: cine a deschis un raport trimis pe mail.
        </p>
        <form action="/api/activity/login" method="post" className="mt-10 grid gap-4">
          <input
            name="key"
            type="password"
            placeholder="Cheie"
            className="h-[52px] rounded-none border border-black/20 px-4 font-read"
          />
          <button className="h-[52px] bg-kaki font-block text-sm font-bold uppercase text-white hover:bg-black">
            Intră
          </button>
          {sp.err ? (
            <p className="font-read text-sm text-terracotta">Cheie greșită.</p>
          ) : null}
        </form>
      </div>
    );
  }

  const events = await listActivity(80);

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-16 lg:px-8">
      <h1 className="font-block text-3xl font-bold uppercase text-ink">Cine a deschis</h1>
      <p className="mt-4 max-w-2xl font-read text-lg text-ink">
        Pixelul din mail e slab (Gmail îl blochează). Semnalul bun e click-ul pe link — atunci
        primiți mail la {process.env.LEAD_TO_EMAIL || "hello@vreau-site.ro"} și puteți suna cât e
        încă pe pagină.
      </p>

      <form action="/api/activity/mint" method="post" className="mt-12 grid gap-3 sm:grid-cols-4">
        <input
          name="reportId"
          placeholder="ID raport"
          required
          className="h-[52px] rounded-none border border-black/20 px-4 font-read sm:col-span-1"
        />
        <input
          name="to"
          type="email"
          placeholder="Email dealer"
          required
          className="h-[52px] rounded-none border border-black/20 px-4 font-read sm:col-span-1"
        />
        <input
          name="dealer"
          placeholder="Nume dealer"
          className="h-[52px] rounded-none border border-black/20 px-4 font-read sm:col-span-1"
        />
        <button className="h-[52px] bg-kaki font-block text-sm font-bold uppercase text-white hover:bg-black">
          Link de urmărit
        </button>
      </form>
      {sp.minted ? (
        <p className="mt-4 break-all font-read text-sm text-ink">
          <a className="underline" href={sp.minted}>
            {sp.minted}
          </a>
        </p>
      ) : null}

      <ul className="mt-16 divide-y divide-black/10 border-t border-black/10">
        {events.length === 0 ? (
          <li className="py-8 font-read text-muted">Nicio deschidere încă.</li>
        ) : (
          events.map((e) => (
            <li key={e.id} className="grid gap-1 py-6 sm:grid-cols-12 sm:items-baseline">
              <p className="font-block text-xs uppercase text-muted sm:col-span-3">
                {new Date(e.at).toLocaleString("ro-RO")}
              </p>
              <p className="font-read text-ink sm:col-span-4">
                {e.to || "fără email"} · {e.dealer || e.reportId}
              </p>
              <p className="font-block text-xs uppercase text-kaki sm:col-span-2">
                {e.kind === "page" ? "click" : "pixel"}
              </p>
              <p className="font-read text-sm sm:col-span-3">
                <a className="underline" href={`/raport/${e.reportId}${e.token ? `?m=${e.token}` : ""}`}>
                  raport
                </a>
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
