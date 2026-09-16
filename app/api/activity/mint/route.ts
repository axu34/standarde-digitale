import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createMailToken, trackedReportUrl } from "@/lib/track";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.ACTIVITY_KEY;
  const jar = await cookies();
  const origin = new URL(req.url).origin;
  if (!key || jar.get("sd_activity")?.value !== key) {
    return NextResponse.redirect(new URL("/activitate?err=1", origin), 303);
  }
  const form = await req.formData();
  const reportId = String(form.get("reportId") || "").trim();
  const to = String(form.get("to") || "").trim();
  const dealer = String(form.get("dealer") || "").trim();
  if (!reportId || !to || !/^[A-Za-z0-9_-]{6,40}$/.test(reportId)) {
    return NextResponse.redirect(new URL("/activitate", origin), 303);
  }
  const mail = await createMailToken({ reportId, to, dealer, city: "" });
  const url = trackedReportUrl(reportId, mail.token);
  return NextResponse.redirect(
    new URL(`/activitate?minted=${encodeURIComponent(url)}`, origin),
    303,
  );
}
