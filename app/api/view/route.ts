import { recordView } from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { reportId?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const reportId = (body.reportId || "").trim();
  const token = (body.token || "").trim();
  if (!reportId && !token) {
    return Response.json({ error: "missing" }, { status: 400 });
  }

  const result = await recordView({
    reportId,
    token: token || null,
    kind: "page",
    ua: req.headers.get("user-agent") || "",
    referrer: req.headers.get("referer") || "",
    purpose: req.headers.get("sec-purpose") || req.headers.get("purpose") || "",
  });

  return Response.json({ ok: result.recorded, firstOpen: result.firstOpen });
}
