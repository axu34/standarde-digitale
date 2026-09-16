import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.ACTIVITY_KEY;
  const origin = new URL(req.url).origin;
  if (!key) {
    return NextResponse.redirect(new URL("/activitate", origin), 303);
  }
  const form = await req.formData();
  const given = String(form.get("key") || "");
  if (given !== key) {
    return NextResponse.redirect(new URL("/activitate?err=1", origin), 303);
  }
  const res = NextResponse.redirect(new URL("/activitate", origin), 303);
  res.cookies.set("sd_activity", key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
