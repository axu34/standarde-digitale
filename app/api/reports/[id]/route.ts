import { loadReport } from "@/lib/audit/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) {
    return Response.json({ error: "Raportul nu a fost găsit." }, { status: 404 });
  }
  return Response.json(report);
}
