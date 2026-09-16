import { loadReport } from "@/lib/audit/store";
import { ReportView } from "@/components/ReportView";
import { TrackReport } from "@/components/TrackReport";
import { ClientReport } from "./ClientReport";

export const dynamic = "force-dynamic";

export default async function RaportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const { m } = await searchParams;
  const report = await loadReport(id);
  if (report) {
    return (
      <>
        <TrackReport reportId={id} token={m} />
        <ReportView report={report} />
      </>
    );
  }
  return <ClientReport id={id} token={m} />;
}
