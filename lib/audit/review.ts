import { generateText, Output } from "ai";
import { z } from "zod";
import { applyAiOverrides } from "./evaluate";
import type {
  CriterionResult,
  FaviconAnalysis,
  Screenshot,
  Snapshot,
} from "./types";

const reviewSchema = z.object({
  notes: z
    .string()
    .describe("One short Romanian sentence on what the screenshots change"),
  overrides: z
    .array(
      z.object({
        id: z
          .string()
          .describe("Criterion id, e.g. agent-logo, colors, q-mix, layout"),
        verdict: z.enum(["OK", "PARTIAL", "KO"]),
        summary: z.string().describe("Dealer-facing Romanian summary"),
        reason: z.string().describe("Why the screenshot contradicts the heuristic"),
        confidence: z.number().min(0).max(1),
      }),
    )
    .describe("Only criteria where the screenshot clearly contradicts the first pass"),
});

export type ReviewResult = {
  tnp: CriterionResult[];
  quality: CriterionResult[];
  model: string;
  applied: number;
  notes: string;
};

const MODELS = [
  process.env.AUDIT_AI_MODEL,
  "spacexai/grok-4.6",
  "spacexai/grok-4.1-fast-non-reasoning",
  "google/gemini-3.5-flash",
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const m = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!m) return null;
  return Buffer.from(m[1], "base64");
}

function compactCriteria(items: CriterionResult[]) {
  return items.map((c) => ({
    id: c.id,
    verdict: c.verdict,
    summary: c.summary,
    details: c.details.slice(0, 3),
  }));
}

export async function reviewWithVision(input: {
  snap: Snapshot;
  favicon: FaviconAnalysis;
  tnp: CriterionResult[];
  quality: CriterionResult[];
  screenshots: Screenshot[];
}): Promise<ReviewResult | null> {
  const hasGateway = Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.VERCEL,
  );
  if (!hasGateway) return null;

  const images = ["header", "desktop", "footer"]
    .map((id) => input.screenshots.find((s) => s.id === id))
    .filter((s): s is Screenshot => Boolean(s));
  if (!images.length) return null;

  const prompt = `Ești al doilea ochi pe un audit de website Dacia 2026 (grila de website a rețelei). Nu ești auditorul oficial.

REGULI:
- Notezi DOAR pagina Dacia din screenshot-uri. Homepage-ul agentului cu mai multe mărci este PERMIS. Nu penaliza Renault de pe homepage-ul multi-brand.
- Pe pagina Dacia, meniul VIZIBIL nu trebuie să aibă Renault/Alpine. Un meniu Wix ascuns (off-canvas) nu contează.
- Logo agent: dacă vezi un logo al dealerului în dreapta headerului, NU e KO. Dacă există dar link-ul e greșit / lipsește, e PARTIAL.
- Faviconul oficial este emblema albă pe kaki #646B52. Wordmark-ul Dacia negru NU este faviconul corect. Nu trece url-favicon la OK dacă măsurarea zice că nu e kaki.
- Footer-ul trebuie să fie kaki #646B52. Dacă screenshot-ul de footer arată kaki clar, poți trece colors la OK (doar dacă nu vezi benzi gri #F3F4F6). Dacă footer-ul e alb/negru/transparent, lasă PARTIAL cu un summary precis, nu «gri / albastru».
- Culorile: gri de secțiune (#F3F4F6 etc.) și albastru de dealer pică. Nu inventa gri dacă nu e vizibil.
- Scrie summary în română, pentru dealer, fără jargon intern (parcurs, TNP, monomarcă).
- Override doar când screenshot-ul contrazice clar prima trecere. confidence >= 0.75. Dacă ești nesigur, lasă overrides gol.

Prima trecere (heuristică):
${JSON.stringify(
  {
    url: input.snap.url,
    nav: input.snap.header.navLabels,
    agent: input.snap.header.agent,
    footerBg: input.snap.footerBg,
    favicon: input.favicon,
    tnp: compactCriteria(input.tnp),
    quality: compactCriteria(input.quality.filter((c) => ["q-mix", "q-legal"].includes(c.id))),
  },
  null,
  2,
)}`;

  const imageParts = images
    .map((s) => {
      const buf = dataUrlToBuffer(s.dataUrl);
      if (!buf) return null;
      return {
        type: "image" as const,
        image: buf,
        mediaType: "image/jpeg" as const,
      };
    })
    .filter((p): p is { type: "image"; image: Buffer; mediaType: "image/jpeg" } => Boolean(p));

  let lastError = "";
  for (const model of MODELS) {
    try {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: reviewSchema,
          name: "dacia_audit_review",
          description: "Overrides for Dacia dealer website audit",
        }),
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }, ...imageParts],
          },
        ],
        maxOutputTokens: 900,
        abortSignal: AbortSignal.timeout(14000),
      });
      if (!output) continue;

      const locked = new Set<string>();
      if (input.favicon.kakiLike === false) locked.add("url-favicon");

      const tnpRun = applyAiOverrides(input.tnp, output.overrides, locked);
      const qRun = applyAiOverrides(input.quality, output.overrides, locked);
      return {
        tnp: tnpRun.items,
        quality: qRun.items,
        model,
        applied: tnpRun.applied + qRun.applied,
        notes: output.notes,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "review failed";
    }
  }

  if (lastError) {
    return {
      tnp: input.tnp,
      quality: input.quality,
      model: MODELS[0],
      applied: 0,
      notes: `Verificarea vizuală nu a rulat (${lastError.slice(0, 120)}).`,
    };
  }
  return null;
}
