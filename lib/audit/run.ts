import { nanoid } from "nanoid";
import { BRAND, DISCLAIMER } from "@/lib/brand";
import { formatScore } from "@/lib/utils";
import { launchBrowser } from "./browser";
import { collectSnapshot } from "./collect";
import { resolveDaciaUrl } from "./discover";
import {
  averageScore,
  buildBrief,
  buildChecklist,
  buildPitch,
  countVerdicts,
  evaluateQuality,
  evaluateTnp,
} from "./evaluate";
import { analyzeFavicon } from "./favicon";
import { reviewWithVision } from "./review";
import { saveReport } from "./store";
import type { AuditReport, ProgressEvent, Screenshot, Snapshot } from "./types";

type Emit = (e: ProgressEvent) => void;

async function jpegShot(
  page: import("playwright-core").Page,
  id: string,
  label: string,
  viewport: Screenshot["viewport"],
  options?: { fullPage?: boolean },
): Promise<Screenshot> {
  const buf = await page.screenshot({
    type: "jpeg",
    quality: 52,
    fullPage: Boolean(options?.fullPage),
    animations: "disabled",
  });
  return {
    id,
    label,
    viewport,
    dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
  };
}

const CITY_SLUGS: Record<string, string> = {
  targoviste: "Târgoviște",
  dragasani: "Drăgășani",
  pitesti: "Pitești",
  bucuresti: "București",
  cluj: "Cluj-Napoca",
  timisoara: "Timișoara",
  iasi: "Iași",
  constanta: "Constanța",
  craiova: "Craiova",
  brasov: "Brașov",
  oradea: "Oradea",
  arad: "Arad",
  sibiu: "Sibiu",
  calarasi: "Călărași",
  alexandria: "Alexandria",
  drobeta: "Drobeta-Turnu Severin",
  "targu-jiu": "Târgu Jiu",
  "alba-iulia": "Alba Iulia",
  orastie: "Orăștie",
  odorheiu: "Odorheiu Secuiesc",
  "odorheiu-secuiesc": "Odorheiu Secuiesc",
};

function cityFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    const m = path.match(/dacia-([a-z0-9-]+)/);
    if (!m) return "";
    const slug = m[1];
    const exact = CITY_SLUGS[slug];
    if (exact) return exact;
    const hit = Object.entries(CITY_SLUGS)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([k]) => slug === k || slug.startsWith(`${k}-`) || slug.includes(k));
    return hit?.[1] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}

function guessDealer(snap: Snapshot, title: string): { dealer: string; city: string } {
  const city = snap.header.cityLike || cityFromUrl(snap.url);
  let host = "";
  try {
    host = new URL(snap.url).hostname.replace(/^www\./, "").split(".")[0] || "";
  } catch {
    host = "";
  }
  const fromHost = host.replace(/-/g, " ").toUpperCase();
  const fromJson = (snap.jsonLdName || "")
    .replace(/\s*[|–—-]\s*dacia.*$/i, "")
    .replace(/dacia/gi, "")
    .trim();
  const fromTitle = title.replace(/dacia/gi, "").replace(/[|–—-].*$/, "").trim();
  const dealer =
    fromJson && fromJson.length > 2 && !/^gama$/i.test(fromJson)
      ? fromJson.slice(0, 48)
      : fromHost && fromHost.length > 2
        ? fromHost
        : fromTitle.slice(0, 48) || "Agent Dacia";
  return { dealer, city: city || "—" };
}

export async function runAudit(inputUrl: string, emit: Emit): Promise<AuditReport> {
  const started = Date.now();
  const warnings: string[] = [];
  emit({ type: "progress", step: "browser", message: "Deschid pagina…" });

  const browser = await launchBrowser();
  const screenshots: Screenshot[] = [];
  let snap: Snapshot;

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      locale: "ro-RO",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 StandardeDigitale/1.0",
    });
    page.setDefaultTimeout(20000);

    emit({ type: "progress", step: "goto", message: "Încărcare site…" });
    await page.goto(inputUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

    emit({
      type: "progress",
      step: "discover",
      message: "Caut pagina Dacia + oraș…",
    });
    const resolved = await resolveDaciaUrl(page, inputUrl);
    await new Promise((r) => setTimeout(r, 1800));

    emit({ type: "progress", step: "snapshot", message: "Citesc identitatea vizuală, gama și serviciile…" });
    snap = await collectSnapshot(page);

    emit({ type: "progress", step: "desktop", message: "Captură desktop…" });
    screenshots.push(await jpegShot(page, "desktop", "Homepage desktop", "desktop"));
    const headerShot = await page.screenshot({
      type: "jpeg",
      quality: 60,
      clip: { x: 0, y: 0, width: 1440, height: 110 },
      animations: "disabled",
    });
    screenshots.push({
      id: "header",
      label: "Header",
      viewport: "crop",
      dataUrl: `data:image/jpeg;base64,${headerShot.toString("base64")}`,
    });

    emit({ type: "progress", step: "footer", message: "Captură footer…" });
    await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await new Promise((r) => setTimeout(r, 450));
    screenshots.push(await jpegShot(page, "footer", "Footer", "crop"));
    await page.evaluate(`window.scrollTo(0, 0)`);

    emit({ type: "progress", step: "mobile", message: "Captură mobil 390×844…" });
    await page.setViewportSize({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 600));
    const mobileExtra = (await page.evaluate(
      `({ overflowX: document.documentElement.scrollWidth > window.innerWidth + 12, smallTapTargets: Array.from(document.querySelectorAll("a[href^='tel:'], button, input[type='submit']")).filter(function(el) { var header = document.querySelector("header"); if (header && header.contains(el) && !(el.getAttribute("href") || "").startsWith("tel:")) return false; var r = el.getBoundingClientRect(); var s = getComputedStyle(el); if (s.display === "none" || r.width === 0) return false; return r.width < 44 || r.height < 44; }).length })`,
    )) as { overflowX: boolean; smallTapTargets: number };
    snap = { ...snap, overflowX: mobileExtra.overflowX, smallTapTargets: mobileExtra.smallTapTargets };
    screenshots.push(await jpegShot(page, "mobile", "Homepage mobil", "mobile"));

    if (resolved.switched) {
      warnings.push(
        `Am pornit de la ${resolved.homepage} și am analizat pagina Dacia ${resolved.analyzed}. Homepage-ul multi-brand nu este penalizat.`,
      );
    }

    emit({ type: "progress", step: "favicon", message: "Verific faviconul…" });
    const favicon = await analyzeFavicon(snap.faviconHref, snap.url, [
      snap.appleTouchHref,
    ], page);

    emit({ type: "progress", step: "score", message: "Calculez grila de conformitate…" });
    let tnp = evaluateTnp(snap, favicon);
    let quality = evaluateQuality(snap);

    emit({ type: "progress", step: "review", message: "Verificare vizuală pe capturi…" });
    const reviewed = await reviewWithVision({
      snap,
      favicon,
      tnp,
      quality,
      screenshots,
    }).catch(() => null);
    if (reviewed) {
      tnp = reviewed.tnp;
      quality = reviewed.quality;
      if (reviewed.applied > 0 && reviewed.notes) warnings.push(reviewed.notes);
    }

    const tnpScore = averageScore(tnp);
    const qualityScore = averageScore(quality);
    const counts = countVerdicts(tnp);
    const qualityCounts = countVerdicts(quality);
    const { dealer, city } = guessDealer(snap, snap.title);
    const id = nanoid(12);
    const createdAt = new Date().toISOString();
    const criteria = [...tnp, ...quality];
    const report: AuditReport = {
      id,
      createdAt,
      inputUrl,
      analyzedUrl: snap.url,
      homepageUrl: resolved.homepage,
      title: snap.title,
      dealerGuess: dealer,
      cityGuess: city,
      tnpScore,
      qualityScore,
      tnpLabel: formatScore(tnpScore),
      qualityLabel: formatScore(qualityScore),
      criteria,
      screenshots,
      counts,
      qualityCounts,
      nextAuditWave: BRAND.nextAudit,
      disclaimer: DISCLAIMER,
      engine: {
        browser: true,
        durationMs: Date.now() - started,
        warnings,
        review: reviewed
          ? { model: reviewed.model, applied: reviewed.applied, notes: reviewed.notes }
          : undefined,
      },
      checklist: buildChecklist(criteria),
      brief: buildBrief(criteria),
      pitch: buildPitch(tnpScore, counts.ko),
    };

    emit({ type: "progress", step: "save", message: "Salvez raportul…" });
    const saved = await saveReport(report);
    if (!saved.persisted) {
      report.engine.warnings.push(
        "Raportul este disponibil în sesiunea curentă. Pentru un link permanent, configurați Vercel Blob.",
      );
    }
    emit({ type: "done", id: report.id, report });
    return report;
  } finally {
    await browser.close().catch(() => {});
  }
}
