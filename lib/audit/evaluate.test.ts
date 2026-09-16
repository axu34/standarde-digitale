import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateTnp, averageScore } from "./evaluate";
import type { FaviconAnalysis, Snapshot } from "./types";

function baseSnap(over: Partial<Snapshot> = {}): Snapshot {
  const snap: Snapshot = {
    url: "https://agent.ro/dacia-targoviste",
    title: "Dacia Târgoviște",
    description: "Dealer Dacia Târgoviște, gamă, oferte și service.",
    canonical: "https://agent.ro/dacia-targoviste",
    lang: "ro",
    viewportMeta: "width=device-width, initial-scale=1",
    faviconHref: "https://agent.ro/favicon.png",
    themeColor: "#646B52",
    https: true,
    bodyFont: "Read, sans-serif",
    navFont: "Dacia Block, sans-serif",
    headingFonts: ["Dacia Block"],
    allFonts: ["Dacia Block", "Read"],
    bodyBg: "rgb(255, 255, 255)",
    header: {
      bg: "rgb(255, 255, 255)",
      text: "Dacia Târgoviște Gama Servicii Oferte Contact",
      navLabels: ["Gama Dacia", "Servicii", "Oferte", "Contact"],
      hasDaciaWord: true,
      cityLike: "Târgoviște",
      agent: {
        href: "https://agent.ro/dealer-dacia-despre-noi",
        target: "_blank",
        text: "Agent",
        hasImage: true,
      },
    },
    footerBg: "rgb(100, 107, 82)",
    footerText: "Dacia Târgoviște",
    sectionBgs: [{ bg: "rgb(255, 255, 255)", h: 400, w: 1200 }],
    buttons: [
      {
        text: "DESCOPERĂ",
        radius: 0,
        bg: "rgb(100, 107, 82)",
        color: "rgb(255,255,255)",
        font: "Dacia Block",
        width: 180,
        height: 46,
      },
    ],
    lucideCount: 0,
    models: [
      { key: "spring", label: "Spring", firstIndex: 10, hasPrice: true, priceText: "de la 17.121 €", hasStrikethrough: false },
      { key: "sandero", label: "Sandero", firstIndex: 20, hasPrice: true, priceText: "de la 15.000 €", hasStrikethrough: false },
      { key: "stepway", label: "Stepway", firstIndex: 30, hasPrice: true, priceText: "de la 16.000 €", hasStrikethrough: false },
      { key: "logan", label: "Logan", firstIndex: 40, hasPrice: true, priceText: "de la 14.000 €", hasStrikethrough: false },
      { key: "jogger", label: "Jogger", firstIndex: 50, hasPrice: true, priceText: "de la 18.000 €", hasStrikethrough: false },
      { key: "duster", label: "Duster", firstIndex: 60, hasPrice: true, priceText: "de la 22.000 €", hasStrikethrough: false },
      { key: "bigster", label: "Bigster", firstIndex: 70, hasPrice: true, priceText: "de la 28.000 €", hasStrikethrough: false },
    ],
    modelOrder: ["spring", "sandero", "stepway", "logan", "jogger", "duster", "bigster"],
    pricesOnPage: ["de la 17.121 €"],
    hasStrikethroughPrice: false,
    hasHeroImage: true,
    hasRangeBlock: true,
    hasServicesBlock: true,
    serviceTitles: ["Vânzări mașini noi", "Service"],
    hasNewCarSales: true,
    hoursMentions: ["Luni–Vineri 08:00–17:00"],
    accordionHint: true,
    cookieBanner: { found: true, text: "Accept cookies" },
    legal: { cookies: true, privacy: true, terms: true, anpc: true },
    privacyHref: "https://agent.ro/politica-confidentialitate",
    otherBrands: [],
    mixedBrandPhrases: [],
    telLinks: ["tel:+40245640505"],
    hasMailto: true,
    hasMaps: true,
    jsonLdTypes: ["AutoDealer"],
    jsonLdName: "Agent Dacia Târgoviște",
    schemaAutoDealer: true,
    appleTouchHref: null,
    headings: [{ level: 1, text: "DACIA TÂRGOVIȘTE" }],
    imageCount: 12,
    missingAlt: 0,
    overflowX: false,
    smallTapTargets: 2,
    forms: [{ fields: 4, hasGdpr: true }],
    daciaInUrl: true,
    cityInUrl: true,
    loadMs: 900,
    mixedContent: false,
  };
  return { ...snap, ...over };
}

const favOk: FaviconAnalysis = {
  href: "https://agent.ro/favicon.png",
  kakiLike: true,
  averageHex: "#646B52",
  note: "kaki",
};

describe("TNP scoring", () => {
  it("scores a compliant Dacia page near 100%", () => {
    const items = evaluateTnp(baseSnap(), favOk);
    assert.equal(items.length, 9);
    assert.ok(averageScore(items) >= 95);
    assert.ok(items.every((i) => i.verdict === "OK"));
  });

  it("reproduces the H1-style 72% failure pattern", () => {
    const snap = baseSnap({
      sectionBgs: [{ bg: "rgb(243, 244, 246)", h: 300, w: 1200 }],
      buttons: [
        {
          text: "Află mai multe",
          radius: 24,
          bg: "rgb(37, 99, 235)",
          color: "rgb(255,255,255)",
          font: "Arial",
          width: 200,
          height: 44,
        },
        {
          text: "Contact",
          radius: 20,
          bg: "rgb(37, 99, 235)",
          color: "rgb(255,255,255)",
          font: "Arial",
          width: 160,
          height: 44,
        },
        {
          text: "Ofertă",
          radius: 20,
          bg: "rgb(29, 78, 216)",
          color: "rgb(255,255,255)",
          font: "Arial",
          width: 160,
          height: 44,
        },
      ],
      hoursMentions: [],
    });
    const items = evaluateTnp(snap, favOk);
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    assert.equal(byId.colors.verdict, "KO");
    assert.equal(byId.ui.verdict, "KO");
    assert.equal(byId.services.verdict, "PARTIAL");
    const score = averageScore(items);
    assert.ok(score > 65 && score < 80, `expected ~72, got ${score}`);
  });

  it("fails missing Dacia URL", () => {
    const snap = baseSnap({
      url: "https://agent.ro/",
      daciaInUrl: false,
      cityInUrl: false,
    });
    const url = evaluateTnp(snap, favOk).find((i) => i.id === "url-favicon");
    assert.equal(url?.verdict, "KO");
  });

  it("flags Bigster-first range as partial", () => {
    const snap = baseSnap({
      modelOrder: ["bigster", "duster", "spring", "sandero", "stepway", "logan", "jogger"],
    });
    const range = evaluateTnp(snap, favOk).find((i) => i.id === "range");
    assert.equal(range?.verdict, "PARTIAL");
  });
});
