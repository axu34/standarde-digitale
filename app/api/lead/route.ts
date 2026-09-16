import { sendLeadNotification, sendReportToDealer } from "@/lib/email";

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
    city?: string;
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

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || "https://standarde-digitale.vercel.app";
  const reportUrl = body.reportId ? `${origin.replace(/\/$/, "")}/raport/${body.reportId}` : "";

  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: "Emailul nu este configurat. Sunați-ne sau scrieți pe WhatsApp." },
      { status: 503 },
    );
  }

  const notified = await sendLeadNotification({
    name,
    dealer: body.dealer || "",
    phone,
    email,
    message: body.message || "",
    reportId: body.reportId,
    score: body.score,
    url: body.url,
    reportUrl,
  });

  let mailedReport = false;
  if (email && reportUrl) {
    mailedReport = await sendReportToDealer({
      to: email,
      dealer: body.dealer || name,
      city: body.city || "",
      score: body.score || "—",
      reportUrl,
      analyzedUrl: body.url || reportUrl,
    });
  }

  if (!notified) {
    return Response.json(
      { error: "Nu am putut trimite. Încercați WhatsApp." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, mailedReport });
}
