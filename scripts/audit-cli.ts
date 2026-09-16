import { normalizeInputUrl } from "../lib/audit/ssrf";
import { runAudit } from "../lib/audit/run";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/audit-cli.ts <url>");
    process.exit(1);
  }

  const normalized = normalizeInputUrl(url);
  const report = await runAudit(normalized, (e) => {
    if (e.type === "progress") console.error(`[${e.step}] ${e.message}`);
    if (e.type === "error") console.error(e.message);
  });

  console.log(
    JSON.stringify(
      {
        id: report.id,
        analyzedUrl: report.analyzedUrl,
        tnp: report.tnpLabel,
        quality: report.qualityLabel,
        tnpCriteria: report.criteria
          .filter((c) => c.group === "tnp")
          .map((c) => ({
            id: c.id,
            verdict: c.verdict,
            score: c.score,
            summary: c.summary,
          })),
        qualityCriteria: report.criteria
          .filter((c) => c.group === "quality")
          .map((c) => ({ id: c.id, verdict: c.verdict, score: c.score })),
        warnings: report.engine.warnings,
        durationMs: report.engine.durationMs,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
