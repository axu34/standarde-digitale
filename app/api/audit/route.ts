import { normalizeInputUrl } from "@/lib/audit/ssrf";
import { rateLimit } from "@/lib/audit/rate-limit";
import { runAudit } from "@/lib/audit/run";
import type { ProgressEvent } from "@/lib/audit/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  let body: { url?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  let url: string;
  try {
    url = normalizeInputUrl(body.url || "");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "URL invalid." },
      { status: 400 },
    );
  }

  if (!rateLimit(clientIp(req))) {
    return Response.json(
      { error: "Prea multe verificări de pe această adresă. Încercați peste o oră." },
      { status: 429 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runAudit(url, send);
      } catch (e) {
        send({
          type: "error",
          message:
            e instanceof Error
              ? e.message
              : "Nu am putut analiza site-ul. Verificați adresa și reîncercați.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
