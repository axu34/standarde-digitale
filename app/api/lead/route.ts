import { mkdir, writeFile } from "node:fs/promises";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    name?: string;
    dealer?: string;
    phone?: string;
    email?: string;
    message?: string;
    reportId?: string;
    score?: string;
    url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  if (!name || (!phone && !email)) {
    return Response.json(
      { error: "Numele și un telefon sau email sunt necesare." },
      { status: 400 },
    );
  }

  const payload = {
    ...body,
    name,
    phone,
    email,
    at: new Date().toISOString(),
  };

  try {
    await mkdir("/tmp/standarde-digitale-leads", { recursive: true });
    await writeFile(
      `/tmp/standarde-digitale-leads/${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
    );
  } catch {
    /* ignore */
  }

  const key = process.env.BREVO_API_KEY;
  if (key) {
    const html = `
      <p><b>${name}</b> / ${body.dealer || "—"}</p>
      <p>Tel: ${phone}<br>Email: ${email}</p>
      <p>Site: ${body.url || "—"}<br>Scor: ${body.score || "—"}<br>Raport: ${body.reportId || "—"}</p>
      <p>${(body.message || "").replace(/</g, "")}</p>
    `;
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": key,
      },
      body: JSON.stringify({
        sender: { name: BRAND.agency, email: BRAND.email },
        to: [{ email: process.env.LEAD_TO_EMAIL || BRAND.email }],
        subject: `Lead audit Dacia — ${body.dealer || name}`,
        htmlContent: html,
      }),
    }).catch(() => {});
  }

  return Response.json({ ok: true });
}
