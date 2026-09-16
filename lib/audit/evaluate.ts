import { BRAND, DISCLAIMER } from "@/lib/brand";
import {
  isDaciaButtonBg,
  isForbiddenSection,
  isKaki,
  isNearWhite,
  looksBlue,
  parseCssColor,
  toHex,
} from "./colors";
import { orderPenalty } from "./models";
import type {
  CriterionResult,
  FaviconAnalysis,
  Snapshot,
  Verdict,
} from "./types";

function result(
  partial: Omit<CriterionResult, "score"> & { verdict: Verdict },
): CriterionResult {
  const score = partial.verdict === "OK" ? 100 : partial.verdict === "PARTIAL" ? 50 : 0;
  return { ...partial, score };
}

function fontLooksOfficial(font: string): boolean {
  return /dacia|block|read|renault/i.test(font);
}

function fontLooksGeneric(font: string): boolean {
  return /roboto|open sans|montserrat|poppins|inter|arial|helvetica|lato|nunito|raleway|ubuntu|source sans|system-ui|segoe/i.test(
    font,
  );
}

function otherBrandNav(labels: string[]): string[] {
  return labels.filter((l) => /renault|alpine|nissan/i.test(l));
}

function applyOverride(
  item: CriterionResult,
  verdict: Verdict,
  summary: string,
  extraDetail: string,
): CriterionResult {
  const next = result({ ...item, verdict, summary });
  next.details = [...item.details, extraDetail];
  return next;
}

export function evaluateTnp(
  snap: Snapshot,
  favicon: FaviconAnalysis,
): CriterionResult[] {
  return [
    urlFavicon(snap, favicon),
    layout(snap),
    agentLogo(snap),
    colors(snap),
    typography(snap),
    ui(snap),
    range(snap),
    prices(snap),
    services(snap),
  ];
}

function urlFavicon(snap: Snapshot, favicon: FaviconAnalysis): CriterionResult {
  const urlOk = snap.daciaInUrl;
  const cityOk = snap.cityInUrl || /^https?:\/\/dacia[.-]/i.test(snap.url);
  const favOk = favicon.kakiLike === true;
  const evidence = [
    { kind: "url" as const, label: "URL analizat", value: snap.url },
    {
      kind: "color" as const,
      label: "Favicon",
      value: favicon.note,
      hex: favicon.averageHex || undefined,
    },
  ];
  if (urlOk && (cityOk || /^https?:\/\/dacia\./i.test(snap.url)) && favOk) {
    return result({
      id: "url-favicon",
      number: 3,
      title: "URL și favicon",
      officialName: "Branding – URL & Favicon",
      group: "tnp",
      verdict: "OK",
      summary: "URL-ul conține Dacia, iar faviconul este emblemă pe kaki.",
      details: [
        cityOk
          ? "Formatul include Dacia + oraș (path sau subdomeniu)."
          : "Subdomeniul Dacia este o formulă acceptată.",
        favicon.note,
      ],
      evidence,
      recommendation: "Păstrați URL-ul Dacia + oraș și faviconul oficial.",
    });
  }
  if (urlOk && !favOk) {
    return result({
      id: "url-favicon",
      number: 3,
      title: "URL și favicon",
      officialName: "Branding – URL & Favicon",
      group: "tnp",
      verdict: "PARTIAL",
      summary: "URL-ul are Dacia, dar faviconul nu pare emblema albă pe kaki.",
      details: [favicon.note],
      evidence,
      recommendation:
        "Folosiți faviconul oficial: emblemă albă pe fundal kaki #646B52, minim 16px.",
    });
  }
  if (!urlOk) {
    return result({
      id: "url-favicon",
      number: 3,
      title: "URL și favicon",
      officialName: "Branding – URL & Favicon",
      group: "tnp",
      verdict: "KO",
      summary: "Adresa analizată nu conține Dacia — lipsește pagina Dacia + oraș.",
      details: [
        "Formule acceptate: agent.ro/dacia-oras sau dacia-oras.agent.ro.",
        favicon.note,
      ],
      evidence,
      recommendation:
        "Creați o pagină Dacia, cu Dacia și orașul în adresă.",
    });
  }
  return result({
    id: "url-favicon",
    number: 3,
    title: "URL și favicon",
    officialName: "Branding – URL & Favicon",
    group: "tnp",
    verdict: "PARTIAL",
    summary: "Există Dacia în URL, dar lipsește orașul din path/subdomeniu.",
    details: ["Auditorul caută Dacia + oraș, nu doar /dacia."],
    evidence,
    recommendation: "Folosiți formula dacia-oras pe path sau subdomeniu.",
  });
}

function layout(snap: Snapshot): CriterionResult {
  const headerWhite = (() => {
    const c = parseCssColor(snap.header.bg);
    return !c || c.a < 0.2 || isNearWhite(c);
  })();
  const blocks = [
    snap.header.hasDaciaWord || headerWhite,
    snap.hasHeroImage,
    snap.hasRangeBlock || snap.models.length >= 3,
    snap.hasServicesBlock,
  ].filter(Boolean).length;
  const navHits = otherBrandNav(snap.header.navLabels);
  const brandLeak = snap.mixedBrandPhrases.filter(Boolean).length > 0 || navHits.length > 0;

  const details = [
    headerWhite
      ? "Header cu fundal alb / aproape alb."
      : `Header cu fundal ${snap.header.bg} — ghidul cere alb.`,
    snap.hasHeroImage ? "Există un banner / imagine hero." : "Nu am identificat un banner hero.",
    snap.models.length >= 3
      ? `Gama detectată: ${snap.models.map((m) => m.label).join(", ")}.`
      : "Gama de vehicule noi este incompletă sau lipsă.",
    snap.hasServicesBlock
      ? "Există o zonă de servicii."
      : "Nu am identificat lista de servicii.",
  ];
  if (brandLeak) {
    details.push(
      `Pe pagina Dacia, în meniul vizibil sau în text, apar alte mărci: ${
        navHits[0] || snap.mixedBrandPhrases.filter(Boolean)[0] || snap.otherBrands.join(", ")
      }. Homepage-ul cu mai multe mărci este permis.`,
    );
  }

  let verdict: Verdict = "OK";
  if (blocks <= 1 || (brandLeak && blocks < 4)) verdict = "KO";
  else if (blocks < 4 || brandLeak || !headerWhite) verdict = "PARTIAL";

  return result({
    id: "layout",
    number: 4,
    title: "Layout și UX",
    officialName: "Website Layout & UX",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Homepage-ul Dacia are navigarea, bannerul, gama și serviciile pe pozițiile din ghid."
        : "Structura paginii Dacia nu respectă cele 4 blocuri din ghid sau amestecă alte mărci.",
    details,
    evidence: [
      { kind: "screenshot", label: "Homepage desktop", screenshotId: "desktop" },
      {
        kind: "quote",
        label: "Navigare",
        quote: snap.header.navLabels.slice(0, 8).join(" · ") || "—",
      },
    ],
    recommendation:
      "Păstrați pe pagina Dacia doar: header alb, banner, gamă vehicule noi, servicii. Fără logo-uri sau CTA-uri către alte mărci.",
  });
}

function homepageLike(href: string, pageUrl: string): boolean {
  try {
    const a = new URL(href, pageUrl);
    const page = new URL(pageUrl);
    if (a.origin !== page.origin) return false;
    const path = a.pathname.replace(/\/$/, "") || "/";
    return path === "/" || path === "";
  } catch {
    return false;
  }
}

function agentLogo(snap: Snapshot): CriterionResult {
  const agent = snap.header.agent;
  if (!agent || (!agent.hasImage && !agent.href && !agent.text)) {
    return result({
      id: "agent-logo",
      number: 5,
      title: "Logo agent pe homepage",
      officialName: "Group Dealer Logo On Homepage",
      group: "tnp",
      verdict: "KO",
      summary: "Nu am identificat logo-ul agentului în dreapta headerului.",
      details: [
        "Ghidul cere logo-ul agentului în dreapta, cu click spre pagina Despre noi într-un tab nou.",
      ],
      evidence: [{ kind: "screenshot", label: "Header", screenshotId: "header" }],
      recommendation:
        "Puneți logo-ul agentului în dreapta headerului, link către Despre noi, target=_blank.",
    });
  }

  const href = (agent.href || "").trim();
  const blank = /blank/i.test(agent.target);
  const about = /despre|about|prezentare|companie|istoric|who-we/i.test(href);
  const missingHref = !href || href === snap.url || href.endsWith("#") || /^javascript:/i.test(href);
  const toHome = Boolean(href) && homepageLike(href, snap.url);
  const hrefOk = Boolean(href) && !missingHref && !toHome;

  let verdict: Verdict = "OK";
  let summary = "Logo-ul agentului din header deschide un tab nou.";
  if (!hrefOk || !blank) {
    verdict = "PARTIAL";
    if (missingHref) {
      summary =
        "Logo-ul agentului există în dreapta headerului, dar nu este un link (sau href-ul lipsește).";
    } else if (toHome) {
      summary =
        "Logo-ul agentului există, dar link-ul duce spre homepage, nu spre Despre noi într-un tab nou.";
    } else if (!blank) {
      summary = "Logo-ul agentului există, dar nu deschide un tab nou (target=_blank).";
    } else if (!about) {
      summary = "Logo-ul agentului există, dar link-ul nu pare pagina Despre noi.";
    }
  }

  return result({
    id: "agent-logo",
    number: 5,
    title: "Logo agent pe homepage",
    officialName: "Group Dealer Logo On Homepage",
    group: "tnp",
    verdict,
    summary,
    details: [
      href ? `Link detectat: ${href}` : "Imagine/logo fără <a href>.",
      agent.hasImage ? "Are imagine / logo." : "Pare text, nu neapărat logo.",
      `target="${agent.target || "_self"}"`,
      about ? "Link-ul seamănă cu Despre noi." : "Ghidul cere click → Despre noi, tab nou.",
    ],
    evidence: [
      ...(href ? [{ kind: "url" as const, label: "Link agent", value: href }] : []),
      { kind: "screenshot", label: "Header", screenshotId: "header" },
    ],
    recommendation:
      "Click pe logo-ul agentului → pagina Despre noi (doar Dacia), într-un tab nou.",
  });
}

function colors(snap: Snapshot): CriterionResult {
  const body = parseCssColor(snap.bodyBg);
  const footer = parseCssColor(snap.footerBg);
  const forbidden = snap.sectionBgs
    .map((s) => {
      const c = parseCssColor(s.bg);
      if (!c || !isForbiddenSection(c)) return null;
      return { hex: toHex(c), h: s.h };
    })
    .filter((x): x is { hex: string; h: number } => Boolean(x));
  const blueSections = snap.sectionBgs
    .map((s) => {
      const c = parseCssColor(s.bg);
      if (!c || c.a < 0.85 || s.h < 180 || !looksBlue(c)) return null;
      return toHex(c);
    })
    .filter((x): x is string => Boolean(x));

  const uniqueForbidden = [...new Set(forbidden.map((f) => f.hex))];
  const uniqueBlue = [...new Set(blueSections)];
  const footerTransparent = !footer || footer.a < 0.2;
  const footerKaki = footer ? isKaki(footer, 48) : false;
  const bodyWhite = !body || body.a < 0.2 || isNearWhite(body);

  const details: string[] = [];
  details.push(
    bodyWhite
      ? "Fundalul paginii este alb."
      : `Fundal pagină: ${body ? toHex(body) : snap.bodyBg}.`,
  );
  if (footerKaki) {
    details.push(`Footer kaki (${snap.footerBg}).`);
  } else if (footerTransparent) {
    details.push(
      "Footer-ul nu are fundal kaki măsurabil (transparent — frecvent pe Wix). Ghidul cere footer #646B52.",
    );
  } else {
    details.push(
      `Footer-ul nu este kaki-ul oficial #646B52 (am măsurat ${footer ? toHex(footer) : snap.footerBg || "gol"}).`,
    );
  }
  if (uniqueForbidden.length) {
    details.push(
      `Culori de secțiune interzise (inclusiv griul #F3F4F6 care a picat auditul H1): ${uniqueForbidden.join(", ")}.`,
    );
  }
  if (uniqueBlue.length) {
    details.push(`Albastru de dealer pe secțiuni mari: ${uniqueBlue.join(", ")}.`);
  }

  let verdict: Verdict = "OK";
  if (uniqueForbidden.length >= 1 || uniqueBlue.length >= 1) verdict = "KO";
  else if (!footerKaki || !bodyWhite) verdict = "PARTIAL";

  let summary = "Paleta vizibilă respectă kaki, alb, orange, terracotta.";
  if (verdict === "KO") {
    summary = uniqueForbidden.length
      ? `Secțiuni cu gri sau culori în afara paletei: ${uniqueForbidden[0]}.`
      : `Albastru de dealer pe secțiuni: ${uniqueBlue[0]}.`;
  } else if (verdict === "PARTIAL") {
    if (!bodyWhite) summary = `Fundalul paginii nu este alb curat (${body ? toHex(body) : snap.bodyBg}).`;
    else if (footerTransparent) {
      summary = "Footer-ul nu este kaki #646B52 (fundal transparent).";
    } else {
      summary = `Footer-ul nu este kaki #646B52 (am măsurat ${footer ? toHex(footer) : "gol"}).`;
    }
  }

  return result({
    id: "colors",
    number: 6,
    title: "Culori",
    officialName: "Branding – Colors",
    group: "tnp",
    verdict,
    summary,
    details,
    evidence: [
      ...uniqueForbidden.slice(0, 4).map((hex) => ({
        kind: "color" as const,
        label: "Culoare secțiune",
        hex,
        value: hex,
      })),
      {
        kind: "color",
        label: "Footer",
        hex: footer && footer.a >= 0.2 ? toHex(footer) : undefined,
        value: snap.footerBg,
      },
      { kind: "screenshot", label: "Homepage", screenshotId: "desktop" },
      { kind: "screenshot", label: "Footer", screenshotId: "footer" },
    ],
    recommendation:
      "Doar paleta Dacia. Fundal de pagină alb curat. Fără #F3F4F6 / gray-50 pe secțiuni. Footer kaki #646B52.",
  });
}

function typography(snap: Snapshot): CriterionResult {
  const pool = [snap.bodyFont, snap.navFont, ...snap.headingFonts].filter(Boolean);
  const official = pool.filter(fontLooksOfficial);
  const genericHead = [snap.navFont, ...snap.headingFonts].filter(fontLooksGeneric);
  const details = [
    `Body: ${snap.bodyFont || "n/a"}`,
    `Navigare: ${snap.navFont || "n/a"}`,
    snap.headingFonts[0] ? `Titlu: ${snap.headingFonts[0]}` : "Nu am citit fontul titlurilor.",
  ];

  let verdict: Verdict = "KO";
  if (official.length >= 1 && genericHead.length === 0) verdict = "OK";
  else if (official.length >= 1 || (genericHead.length > 0 && official.length > 0))
    verdict = "PARTIAL";
  if (official.length === 0 && genericHead.length === 0) {
    verdict = "PARTIAL";
    details.push(
      "Fontul computat nu are un nume recunoscut (Dacia Block / Read). Poate fi totuși fontul oficial, servit sub un nume intern.",
    );
  }

  return result({
    id: "typography",
    number: 7,
    title: "Tipografie",
    officialName: "Branding – Typography",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Fonturile detectate sunt Dacia Block / Read."
        : "Titlurile sau meniul folosesc fonturi generice (Google / Arial etc.).",
    details,
    evidence: pool.slice(0, 4).map((f) => ({
      kind: "font" as const,
      label: "font-family",
      value: f,
    })),
    recommendation:
      "Dacia Block pe titluri, CTA și meniu. Read pe body. Dacă un singur font — Block.",
  });
}

function ui(snap: Snapshot): CriterionResult {
  const ctas = snap.buttons.filter((b) => b.height >= 36);
  const rounded = ctas.filter((b) => b.radius >= 8);
  const blue = ctas.filter((b) => {
    const c = parseCssColor(b.bg);
    return c ? looksBlue(c) || !isDaciaButtonBg(c) : false;
  });
  const offPalette = ctas.filter((b) => {
    const c = parseCssColor(b.bg);
    if (!c || c.a < 0.4) return false;
    return !isDaciaButtonBg(c) && !isNearWhite(c);
  });

  const details = [
    `${ctas.length} butoane / CTA-uri măsurate.`,
    rounded.length
      ? `${rounded.length} au colțuri rotunjite (radius ≥ 8px). Ghidul cere colțuri drepte.`
      : "CTA-urile vizibile au colțuri drepte sau aproape drepte.",
    offPalette.length
      ? `Culori de buton în afara paletei: ${[...new Set(offPalette.map((b) => b.bg))].slice(0, 3).join(", ")}.`
      : "Culorile de buton sunt în familia Dacia / alb / negru.",
    snap.lucideCount > 6
      ? `Am găsit ${snap.lucideCount} icoane tip Lucide — ghidul cere setul Renault Group.`
      : "Nu am detectat un set masiv de icoane Lucide.",
  ];

  let verdict: Verdict = "OK";
  if (rounded.length >= 3 || offPalette.length >= 3 || blue.length >= 2) verdict = "KO";
  else if (rounded.length || offPalette.length || snap.lucideCount > 10) verdict = "PARTIAL";

  return result({
    id: "ui",
    number: 8,
    title: "Componente UI",
    officialName: "Branding – UI Components",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Butoanele au colțuri drepte și culori din paletă."
        : "Butoane rotunjite, culori greșite sau icoane în afara setului Renault Group.",
    details,
    evidence: [
      ...rounded.slice(0, 3).map((b) => ({
        kind: "metric" as const,
        label: `CTA «${b.text || "buton"}»`,
        value: `border-radius ${b.radius}px`,
      })),
      { kind: "screenshot", label: "Homepage", screenshotId: "desktop" },
    ],
    recommendation:
      "CTA: rounded-none, 46px înălțime, hover negru. Icoane din biblioteca Renault Group, inclusiv social.",
  });
}

function range(snap: Snapshot): CriterionResult {
  const keys = snap.modelOrder;
  const { ok, expected, actual } = orderPenalty(keys);
  const details = [
    keys.length
      ? `Modele detectate, în ordinea din pagină: ${actual.join(" → ") || keys.join(" → ")}.`
      : "Nu am identificat gama Dacia (Spring–Bigster).",
    ok || keys.length < 3
      ? keys.length >= 3
        ? "Ordinea este mic → mare (cerința notată de auditorul RO)."
        : "Prea puține modele pentru a nota ordinea."
      : `Ordinea așteptată: ${expected.join(" → ")}.`,
    snap.mixedBrandPhrases.length
      ? `Text mixt pe pagină: «${snap.mixedBrandPhrases[0]}».`
      : "Nu am găsit alte mărci în zona de gamă (text).",
  ];

  let verdict: Verdict = "OK";
  if (keys.length < 3) verdict = "KO";
  else if (!ok) verdict = "PARTIAL";
  if (snap.otherBrands.filter((b) => b !== "Renault").length > 2 && keys.length >= 3) {
    verdict = verdict === "KO" ? "KO" : "PARTIAL";
  }

  return result({
    id: "range",
    number: 9,
    title: "Prezentarea gamei",
    officialName: "Product Page – Range Presentation",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Gama Dacia este prezentă, în ordine de la cel mai mic la cel mai mare."
        : "Gama lipsește, e incompletă sau e sortată greșit (ex. Bigster primul).",
    details,
    evidence: [
      {
        kind: "quote",
        label: "Ordine detectată",
        quote: actual.join(" → ") || "—",
      },
      { kind: "screenshot", label: "Gama", screenshotId: "desktop" },
    ],
    recommendation:
      "Doar Dacia, packshot ¾ pe fundal alb, ordine Spring → Sandero → Stepway → Logan → Jogger → Duster → Bigster → Striker.",
  });
}

function prices(snap: Snapshot): CriterionResult {
  const pricedKeys = new Set(["noul-spring", "striker"]);
  const needed = snap.models.filter((m) => !pricedKeys.has(m.key));
  const withPrice = needed.filter((m) => m.hasPrice);
  const details = [
    needed.length
      ? `${withPrice.length}/${needed.length} modele cu preț de pornire vizibil (fără Striker / Noul Spring, care pot lipsi și pe dacia.ro).`
      : "Nu am găsit modele pe care să verific prețul.",
    snap.hasStrikethroughPrice
      ? "Există preț tăiat (strikethrough) — interzis în România pe pagina Dacia."
      : "Nu am detectat preț tăiat.",
    ...needed.slice(0, 8).map((m) =>
      m.hasPrice
        ? `${m.label}: ${m.priceText}`
        : `${m.label}: fără preț de pornire lângă nume.`,
    ),
  ];

  let verdict: Verdict = "OK";
  if (snap.hasStrikethroughPrice) verdict = "KO";
  else if (needed.length === 0) verdict = "KO";
  else if (withPrice.length === 0) verdict = "KO";
  else if (withPrice.length < needed.length) verdict = "PARTIAL";

  return result({
    id: "price",
    number: 10,
    title: "Preț de pornire",
    officialName: "Product Page – Starting Price",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Fiecare model din catalog are preț de pornire, fără preț tăiat."
        : "Lipsesc prețuri de pornire sau apare preț tăiat.",
    details,
    evidence: snap.pricesOnPage.slice(0, 6).map((p) => ({
      kind: "quote" as const,
      label: "Preț găsit",
      quote: p,
    })),
    recommendation:
      "Afișați «de la … €» pe fiecare model cu preț public. Fără strikethrough. Noul Spring și Striker pot rămâne fără preț cât timp catalogul național e la fel.",
  });
}

function services(snap: Snapshot): CriterionResult {
  const hours = snap.hoursMentions.length > 0;
  const details = [
    snap.hasServicesBlock
      ? `Servicii detectate${snap.serviceTitles.length ? `: ${snap.serviceTitles.slice(0, 6).join(", ")}` : "."}`
      : "Nu am găsit o listă de servicii.",
    snap.hasNewCarSales
      ? "Include vânzări / vehicule noi."
      : "Nu am găsit explicit «Vânzări mașini noi» în lista de servicii.",
    hours
      ? `Orar identificat: «${snap.hoursMentions[0]}»`
      : "Orarul nu este afișat lângă servicii — depunctare clasică (PARTIAL în H1).",
    snap.accordionHint
      ? "Există accordion / chevron."
      : "Nu am detectat un accordion cu indicator pentru servicii.",
  ];

  let verdict: Verdict = "OK";
  if (!snap.hasServicesBlock) verdict = "KO";
  else if (!hours || !snap.hasNewCarSales) verdict = "PARTIAL";

  return result({
    id: "services",
    number: 11,
    title: "Oferte și servicii",
    officialName: "Content Structure – Offers & Services",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Serviciile includ vânzări de mașini noi și orar."
        : "Serviciile sunt incomplete: lipsește orarul sau vânzările de mașini noi.",
    details,
    evidence: [
      {
        kind: "quote",
        label: "Orar",
        quote: snap.hoursMentions[0] || "Orar negăsit",
      },
      { kind: "screenshot", label: "Homepage", screenshotId: "desktop" },
    ],
    recommendation:
      "Listă de servicii cu orar pe fiecare, inclusiv Vânzări mașini noi. Accordion cu chevron vizibil.",
  });
}

export function evaluateQuality(snap: Snapshot): CriterionResult[] {
  return [
    mobile(snap),
    tapTargets(snap),
    https(snap),
    cookiesLegal(snap),
    contact(snap),
    seo(snap),
    a11y(snap),
    performance(snap),
    gdprForms(snap),
    brandMixQuality(snap),
  ];
}

function mobile(snap: Snapshot): CriterionResult {
  const vp = Boolean(snap.viewportMeta && /width\s*=\s*device-width/i.test(snap.viewportMeta));
  let verdict: Verdict = "OK";
  if (!vp && snap.overflowX) verdict = "KO";
  else if (!vp || snap.overflowX) verdict = "PARTIAL";
  return result({
    id: "q-mobile",
    number: 21,
    title: "Mobil / viewport",
    officialName: "Interfață dispozitive mobile",
    group: "quality",
    verdict,
    summary: snap.overflowX
      ? "Pagina are scroll orizontal pe lățimea de telefon — semnal de layout neadaptat."
      : vp
        ? "Meta viewport corect, fără overflow orizontal la captură."
        : "Lipsește meta viewport device-width.",
    details: [
      snap.viewportMeta ? `viewport: ${snap.viewportMeta}` : "Fără meta viewport.",
      snap.overflowX ? "scrollWidth > innerWidth pe mobil." : "Fără overflow orizontal detectat.",
    ],
    evidence: [{ kind: "screenshot", label: "Mobil", screenshotId: "mobile" }],
    recommendation:
      "Design adaptiv, ținte ≥48px, conținutul nu trebuie să iasă din ecran pe 390px.",
  });
}

function tapTargets(snap: Snapshot): CriterionResult {
  let verdict: Verdict = "OK";
  if (snap.smallTapTargets > 16) verdict = "KO";
  else if (snap.smallTapTargets > 6) verdict = "PARTIAL";
  return result({
    id: "q-tap",
    number: 22,
    title: "Ținte tactile",
    officialName: "Tap targets ≥ 48px",
    group: "quality",
    verdict,
    summary:
      snap.smallTapTargets === 0
        ? "Butoanele de apel și de trimitere sunt suficient de mari pe mobil."
        : `${snap.smallTapTargets} butoane de apel / trimitere sub 44px pe mobil.`,
    details: [
      "Măsurăm telefonul și butoanele, nu linkurile din meniu. Ghidul cere minim 48×48px.",
    ],
    evidence: [
      {
        kind: "metric",
        label: "Ținte mici",
        value: String(snap.smallTapTargets),
      },
    ],
    recommendation: "Măriți butonul de telefon și CTA-urile pe ecranul de 390px.",
  });
}

function https(snap: Snapshot): CriterionResult {
  const verdict: Verdict = snap.https && !snap.mixedContent ? "OK" : snap.https ? "PARTIAL" : "KO";
  return result({
    id: "q-https",
    number: 23,
    title: "HTTPS",
    officialName: "Certificat de securitate",
    group: "quality",
    verdict,
    summary: snap.https
      ? snap.mixedContent
        ? "HTTPS activ, dar există resurse http:// (mixed content)."
        : "Site-ul este servit pe HTTPS."
      : "Site-ul nu este pe HTTPS.",
    details: [],
    evidence: [{ kind: "url", label: "Protocol", value: snap.url }],
    recommendation: "HTTPS pe tot site-ul, fără imagini http://.",
  });
}

function cookiesLegal(snap: Snapshot): CriterionResult {
  const okBanner = snap.cookieBanner.found;
  const okCookie = snap.legal.cookies;
  const okPrivacy = snap.legal.privacy;
  const privacyIsCorporate =
    Boolean(snap.privacyHref && /dacia\.ro|renault\./i.test(snap.privacyHref));
  let verdict: Verdict = "OK";
  if (!okBanner && !okCookie && !okPrivacy) verdict = "KO";
  else if (!okBanner || !okCookie || !okPrivacy || privacyIsCorporate) verdict = "PARTIAL";
  return result({
    id: "q-legal",
    number: 24,
    title: "Cookies și confidențialitate",
    officialName: "GDPR agent",
    group: "quality",
    verdict,
    summary:
      verdict === "OK"
        ? "Banner de cookies, politică de cookies și politică de confidențialitate a agentului."
        : "Lipsește bannerul, politica de cookies sau politica este copia de pe dacia.ro.",
    details: [
      okBanner ? "Banner cookies detectat." : "Fără banner cookies la încărcare.",
      okCookie ? "Link politică cookies." : "Fără link cookies în pagină.",
      okPrivacy ? "Link confidențialitate." : "Fără politică de confidențialitate.",
      privacyIsCorporate
        ? "Linkul de confidențialitate duce spre dacia.ro / Renault — ghidul cere politica agentului."
        : "",
      snap.legal.anpc ? "Link ANPC prezent." : "Fără ANPC / SAL vizibil.",
    ].filter(Boolean),
    evidence: [
      {
        kind: "quote",
        label: "Banner",
        quote: snap.cookieBanner.text || "negăsit",
      },
    ],
    recommendation:
      "Banner la prima vizită, cookies în footer, politica de confidențialitate a agentului (nu a mărcii), ANPC SAL.",
  });
}

function contact(snap: Snapshot): CriterionResult {
  const tel = snap.telLinks.length > 0;
  const hours = snap.hoursMentions.length > 0;
  let verdict: Verdict = "OK";
  if (!tel && !hours) verdict = "KO";
  else if (!tel || !hours) verdict = "PARTIAL";
  return result({
    id: "q-contact",
    number: 25,
    title: "Contact vizibil",
    officialName: "Telefon, orar, click-to-call",
    group: "quality",
    verdict,
    summary: tel
      ? "Există tel: (click-to-call)."
      : "Telefonul nu este clickable pe mobil — lead pierdut.",
    details: [
      tel ? `tel: ${snap.telLinks[0]}` : "Niciun link tel:.",
      hours ? "Orar prezent." : "Orar absent.",
      snap.hasMaps ? "Link hartă / direcții." : "Fără link de direcții.",
      snap.hasMailto ? "Email clickable." : "Fără mailto:.",
    ],
    evidence: snap.telLinks.slice(0, 2).map((t) => ({
      kind: "url" as const,
      label: "tel",
      value: t,
    })),
    recommendation:
      "Telefon în header, click-to-call, orar și adresă pe homepage — așteptare EAA 2026 și standard de dealer 2026.",
  });
}

function seo(snap: Snapshot): CriterionResult {
  const titleOk = /dacia/i.test(snap.title);
  const cityOk = snap.cityInUrl || Boolean(snap.header.cityLike);
  const metaOk = snap.description.length > 40;
  const schemaOk = snap.schemaAutoDealer || snap.jsonLdTypes.some((t) => /autodealer|cardealer|localbusiness/i.test(t));
  const n = [titleOk, cityOk, metaOk, schemaOk].filter(Boolean).length;
  const verdict: Verdict = n >= 3 ? "OK" : n >= 2 ? "PARTIAL" : "KO";
  return result({
    id: "q-seo",
    number: 26,
    title: "SEO local",
    officialName: "Title, meta, schema.org",
    group: "quality",
    verdict,
    summary: titleOk
      ? `Title: «${snap.title.slice(0, 90)}»`
      : "Title-ul nu conține Dacia — vizibilitate locală slabă.",
    details: [
      cityOk ? "Orașul apare în URL sau în header." : "Orașul nu e în URL/header.",
      metaOk ? "Meta description prezentă." : "Fără meta description utilă.",
      snap.schemaAutoDealer
        ? "JSON-LD AutoDealer prezent."
        : schemaOk
          ? `JSON-LD: ${snap.jsonLdTypes.slice(0, 4).join(", ")}`
          : "Fără AutoDealer / LocalBusiness JSON-LD.",
    ],
    evidence: [{ kind: "quote", label: "Title", quote: snap.title }],
    recommendation:
      "Title Dacia + oraș, meta, JSON-LD AutoDealer cu telefon, adresă, program.",
  });
}

function a11y(snap: Snapshot): CriterionResult {
  const h1 = snap.headings.filter((h) => h.level === 1);
  let verdict: Verdict = "OK";
  if (h1.length === 0 || snap.missingAlt > 8) verdict = "PARTIAL";
  if (h1.length === 0 && snap.missingAlt > 15) verdict = "KO";
  return result({
    id: "q-a11y",
    number: 27,
    title: "Accesibilitate (EAA)",
    officialName: "Actul European privind Accesibilitatea",
    group: "quality",
    verdict,
    summary: `${h1.length} H1, ${snap.missingAlt} imagini fără alt, lang=${snap.lang || "lipsa"}.`,
    details: [
      snap.lang ? `lang="${snap.lang}"` : "html[lang] lipsește.",
      h1[0] ? `H1: ${h1[0].text}` : "Fără H1.",
      "Site-urile noi după iunie 2025 trebuie să fie accesibile de la lansare.",
    ],
    evidence: [],
    recommendation:
      "Ierarhie de heading, alt pe imagini, lang=ro, tab-uri scurte, pop-up ușor de închis.",
  });
}

function performance(snap: Snapshot): CriterionResult {
  const ms = snap.loadMs;
  let verdict: Verdict = "PARTIAL";
  if (ms != null && ms <= 2500) verdict = "OK";
  else if (ms != null && ms > 5500) verdict = "KO";
  return result({
    id: "q-perf",
    number: 28,
    title: "Viteză de încărcare",
    officialName: "Core Web Vitals (proxy de laborator)",
    group: "quality",
    verdict,
    summary:
      ms != null
        ? `DOMContentLoaded ~ ${Math.round(ms)} ms în laborator (nu înlocuiește CrUX).`
        : "Nu am putut măsura timpul de încărcare.",
    details: [
      "Un site de dealer 2026 țintește LCP ≤ 2,5s pe mobil. Imaginile de gamă trebuie WebP/AVIF, lazy-load sub fold.",
    ],
    evidence:
      ms != null
        ? [{ kind: "metric", label: "DCL", value: `${Math.round(ms)} ms` }]
        : [],
    recommendation:
      "Stack modern (Next.js), imagini optimizate, fără widget-uri grele de stoc pe homepage-ul Dacia.",
  });
}

function gdprForms(snap: Snapshot): CriterionResult {
  const legalAround = snap.legal.privacy || snap.legal.cookies;
  if (snap.forms.length === 0) {
    return result({
      id: "q-forms",
      number: 29,
      title: "Formulare",
      officialName: "Note scurte GDPR pe formulare",
      group: "quality",
      verdict: "PARTIAL",
      summary: "Nu am găsit un formular de lead pe pagina analizată.",
      details: ["Oferta, test drive și service se cer de obicei dintr-un formular scurt."],
      evidence: [],
      recommendation: "Formular scurt (3–5 câmpuri) cu notă operator / scop / drepturi.",
    });
  }
  const withGdpr = snap.forms.filter((f) => f.hasGdpr).length;
  let verdict: Verdict = "KO";
  if (withGdpr === snap.forms.length) verdict = "OK";
  else if (withGdpr > 0 || legalAround) verdict = "PARTIAL";
  return result({
    id: "q-forms",
    number: 29,
    title: "Formulare",
    officialName: "Note scurte GDPR pe formulare",
    group: "quality",
    verdict,
    summary: `${withGdpr}/${snap.forms.length} formulare cu notă de prelucrare lângă câmpuri.`,
    details: [
      ...snap.forms.map(
        (f, i) => `Formular ${i + 1}: ${f.fields} câmpuri${f.hasGdpr ? ", notă GDPR" : ", fără notă în formular"}.`,
      ),
      legalAround
        ? "Există totuși link de confidențialitate / cookies pe pagină."
        : "Nu am găsit politică de confidențialitate pe pagină.",
    ],
    evidence: [],
    recommendation:
      "Notă scurtă lângă formular: operator, scop, drepturi. Consimțământ separat email/SMS.",
  });
}

function brandMixQuality(snap: Snapshot): CriterionResult {
  const navHits = otherBrandNav(snap.header.navLabels);
  const phrases = snap.mixedBrandPhrases.map((p) => p.trim()).filter(Boolean);
  const quote = navHits[0] || phrases[0] || "";
  const verdict: Verdict = navHits.length > 0 || phrases.length > 0 ? "KO" : "OK";
  return result({
    id: "q-mix",
    number: 30,
    title: "Pagină doar Dacia",
    officialName: "Fără puncte de acces către alte mărci",
    group: "quality",
    verdict,
    summary:
      verdict === "OK"
        ? "Pe pagina Dacia nu apar CTA-uri clare către alte mărci. Homepage-ul cu mai multe mărci este permis."
        : `Pe pagina Dacia, meniul sau textul trimite spre altă marcă: «${quote}».`,
    details: [
      "Homepage-ul agentului cu mai multe mărci este permis. Pe pagina Dacia, meniul vizibil nu trebuie să conțină Renault / Alpine / altele.",
      navHits.length
        ? `Navigare vizibilă cu altă marcă: ${navHits.join(" · ")}.`
        : "Navigarea din header-ul vizibil nu conține Renault / Alpine.",
      phrases.length ? `Formulare mixte: ${phrases.slice(0, 3).join(" · ")}.` : "",
    ].filter(Boolean),
    evidence: [
      ...navHits.slice(0, 3).map((q) => ({
        kind: "quote" as const,
        label: "Meniu",
        quote: q,
      })),
      ...phrases.slice(0, 3).map((q) => ({
        kind: "quote" as const,
        label: "Formulare mixtă",
        quote: q,
      })),
    ],
    recommendation:
      "Scoateți Renault / Alpine din meniul, footer-ul și serviciile de pe pagina Dacia. Homepage-ul multi-brand poate rămâne.",
  });
}

export function applyAiOverrides(
  items: CriterionResult[],
  overrides: {
    id: string;
    verdict: Verdict;
    summary: string;
    reason: string;
    confidence: number;
  }[],
  locked: Set<string>,
): { items: CriterionResult[]; applied: number } {
  let applied = 0;
  const next = items.map((item) => {
    const hit = overrides.find((o) => o.id === item.id && o.confidence >= 0.72);
    if (!hit) return item;
    if (locked.has(item.id) && hit.verdict === "OK" && item.verdict !== "OK") {
      return item;
    }
    if (hit.verdict === item.verdict && hit.summary === item.summary) return item;
    applied += 1;
    return applyOverride(
      item,
      hit.verdict,
      hit.summary,
      `Verificare vizuală: ${hit.reason}`,
    );
  });
  return { items: next, applied };
}

export function averageScore(items: CriterionResult[]): number {
  if (!items.length) return 0;
  return items.reduce((s, i) => s + i.score, 0) / items.length;
}

export function countVerdicts(items: CriterionResult[]) {
  return {
    ok: items.filter((i) => i.verdict === "OK").length,
    partial: items.filter((i) => i.verdict === "PARTIAL").length,
    ko: items.filter((i) => i.verdict === "KO").length,
  };
}

export function buildChecklist(criteria: CriterionResult[]): string[] {
  return criteria
    .filter((c) => c.verdict !== "OK")
    .map((c) => `${c.verdict === "KO" ? "[KO]" : "[PARTIAL]"} ${c.title}: ${c.recommendation}`);
}

export function buildBrief(criteria: CriterionResult[]): {
  failing: { title: string; line: string; verdict: Verdict }[];
  passing: string[];
} {
  const failing = criteria
    .filter((c) => c.verdict !== "OK")
    .map((c) => ({ title: c.title, line: c.summary, verdict: c.verdict }));
  const passing = criteria.filter((c) => c.verdict === "OK").map((c) => c.title);
  return { failing, passing };
}

export function buildPitch(
  tnpScore: number,
  ko: number,
): { headline: string; body: string; urgency: string } {
  if (tnpScore >= 95 && ko === 0) {
    return {
      headline: "Grila e în regulă. Menținerea e treaba grea.",
      body: `Prețurile, ofertele și standardele se mișcă între două valuri de audit. Noi le ținem la zi. ${BRAND.price}, gata în ${BRAND.delivery}.`,
      urgency: `Următorul audit: ${BRAND.nextAudit}.`,
    };
  }
  if (tnpScore >= 80) {
    return {
      headline: "Aproape. Ce rămâne se pierde la audit.",
      body: `Trimiteți lista cui vă ține site-ul. Dacă nu o închid până în ${BRAND.nextAudit}, preluăm noi. ${BRAND.price}.`,
      urgency: `Următorul audit: ${BRAND.nextAudit}.`,
    };
  }
  return {
    headline: "În forma actuală, grila de website nu trece.",
    body: `Facem site-urile Dacia pentru ${BRAND.portfolio.map((p) => p.name).join(" și ")}. ${BRAND.price}, gata în ${BRAND.delivery}.`,
    urgency: `Următorul audit: ${BRAND.nextAudit}.`,
  };
}

export { DISCLAIMER };
