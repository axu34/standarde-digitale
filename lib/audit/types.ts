export type Verdict = "OK" | "PARTIAL" | "KO";

export type EvidenceKind =
  | "screenshot"
  | "quote"
  | "metric"
  | "color"
  | "font"
  | "url";

export type Evidence = {
  kind: EvidenceKind;
  label: string;
  value?: string;
  screenshotId?: string;
  quote?: string;
  hex?: string;
};

export type CriterionGroup = "tnp" | "quality";

export type CriterionResult = {
  id: string;
  number: number;
  title: string;
  officialName: string;
  group: CriterionGroup;
  verdict: Verdict;
  score: 0 | 50 | 100;
  summary: string;
  details: string[];
  evidence: Evidence[];
  recommendation: string;
};

export type Screenshot = {
  id: string;
  label: string;
  viewport: "desktop" | "mobile" | "crop";
  dataUrl: string;
};

export type ProgressEvent =
  | { type: "progress"; step: string; message: string }
  | { type: "done"; id: string; report: AuditReport }
  | { type: "error"; message: string };

export type HeaderSnapshot = {
  bg: string;
  text: string;
  navLabels: string[];
  hasDaciaWord: boolean;
  cityLike: string | null;
  agent: {
    href: string;
    target: string;
    text: string;
    hasImage: boolean;
  } | null;
};

export type ButtonSnapshot = {
  text: string;
  radius: number;
  bg: string;
  color: string;
  font: string;
  width: number;
  height: number;
};

export type ModelSnapshot = {
  key: string;
  label: string;
  firstIndex: number;
  hasPrice: boolean;
  priceText: string | null;
  hasStrikethrough: boolean;
};

export type Snapshot = {
  url: string;
  title: string;
  description: string;
  canonical: string | null;
  lang: string | null;
  viewportMeta: string | null;
  faviconHref: string | null;
  themeColor: string | null;
  https: boolean;
  bodyFont: string;
  navFont: string;
  headingFonts: string[];
  allFonts: string[];
  bodyBg: string;
  header: HeaderSnapshot;
  footerBg: string;
  footerText: string;
  sectionBgs: { bg: string; h: number; w: number }[];
  buttons: ButtonSnapshot[];
  lucideCount: number;
  models: ModelSnapshot[];
  modelOrder: string[];
  pricesOnPage: string[];
  hasStrikethroughPrice: boolean;
  hasHeroImage: boolean;
  hasRangeBlock: boolean;
  hasServicesBlock: boolean;
  serviceTitles: string[];
  hasNewCarSales: boolean;
  hoursMentions: string[];
  accordionHint: boolean;
  cookieBanner: { found: boolean; text: string | null };
  legal: {
    cookies: boolean;
    privacy: boolean;
    terms: boolean;
    anpc: boolean;
  };
  privacyHref: string | null;
  otherBrands: string[];
  mixedBrandPhrases: string[];
  telLinks: string[];
  hasMailto: boolean;
  hasMaps: boolean;
  jsonLdTypes: string[];
  jsonLdName: string | null;
  schemaAutoDealer: boolean;
  appleTouchHref: string | null;
  headings: { level: number; text: string }[];
  imageCount: number;
  missingAlt: number;
  overflowX: boolean;
  smallTapTargets: number;
  forms: { fields: number; hasGdpr: boolean }[];
  daciaInUrl: boolean;
  cityInUrl: boolean;
  loadMs: number | null;
  mixedContent: boolean;
};

export type FaviconAnalysis = {
  href: string | null;
  kakiLike: boolean | null;
  averageHex: string | null;
  note: string;
};

export type AuditReport = {
  id: string;
  createdAt: string;
  inputUrl: string;
  analyzedUrl: string;
  homepageUrl: string;
  title: string;
  dealerGuess: string;
  cityGuess: string;
  tnpScore: number;
  qualityScore: number;
  tnpLabel: string;
  qualityLabel: string;
  criteria: CriterionResult[];
  screenshots: Screenshot[];
  counts: { ok: number; partial: number; ko: number };
  qualityCounts: { ok: number; partial: number; ko: number };
  nextAuditWave: string;
  disclaimer: string;
  engine: {
    browser: boolean;
    durationMs: number;
    warnings: string[];
    review?: { model: string; applied: number; notes: string };
  };
  checklist: string[];
  brief: {
    failing: { title: string; line: string; verdict: Verdict }[];
    passing: string[];
  };
  pitch: {
    headline: string;
    body: string;
    urgency: string;
  };
};
