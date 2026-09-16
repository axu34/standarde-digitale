import { recordView } from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  await recordView({
    reportId: "",
    token,
    kind: "pixel",
    ua: req.headers.get("user-agent") || "",
    referrer: req.headers.get("referer") || "",
    purpose: req.headers.get("sec-purpose") || req.headers.get("purpose") || "",
  }).catch(() => null);

  return new Response(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Length": String(GIF.length),
    },
  });
}
