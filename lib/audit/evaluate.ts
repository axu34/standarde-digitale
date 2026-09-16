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
        "Creați un parcurs Dacia dedicat, cu URL care conține Dacia și orașul.",
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
  const brandLeak =
    snap.mixedBrandPhrases.length > 0 ||
    (snap.otherBrands.includes("Renault") &&
      snap.header.navLabels.some((l) => /renault/i.test(l)));

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
      `Pe pagina Dacia apar alte mărci / formulări mixte: ${
        snap.mixedBrandPhrases[0] || snap.otherBrands.join(", ")
      }.`,
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

function agentLogo(snap: Snapshot): CriterionResult {
  const agent = snap.header.agent;
  if (!agent) {
    return result({
      id: "agent-logo",
      number: 5,
      title: "Logo agent pe homepage",
      officialName: "Group Dealer Logo On Homepage",
      group: "tnp",
      verdict: "KO",
      summary: "Nu am identificat logo-ul / linkul agentului în dreapta headerului.",
      details: [
        "Ghidul cere logo-ul agentului în dreapta, cu click spre pagina Despre noi într-un tab nou.",
      ],
      evidence: [{ kind: "screenshot", label: "Header", screenshotId: "header" }],
      recommendation:
        "Puneți logo-ul agentului în dreapta headerului, link către Despre noi, target=_blank.",
    });
  }
  const blank = /blank/i.test(agent.target);
  const verdict: Verdict = blank ? "OK" : "PARTIAL";
  return result({
    id: "agent-logo",
    number: 5,
    title: "Logo agent pe homepage",
    officialName: "Group Dealer Logo On Homepage",
    group: "tnp",
    verdict,
    summary: blank
      ? "Logo-ul agentului din header deschide un tab nou."
      : "Logo-ul agentului există, dar nu deschide un tab nou (target=_blank).",
    details: [
      `Link detectat: ${agent.href}`,
      agent.hasImage ? "Are imagine / logo." : "Pare text, nu neapărat logo.",
      `target="${agent.target || "_self"}"`,
    ],
    evidence: [
      { kind: "url", label: "Link agent", value: agent.href },
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

  const uniqueForbidden = [...new Set(forbidden.map((f) => f.hex))];
  const footerKaki = footer ? isKaki(footer, 48) : false;
  const bodyWhite = !body || body.a < 0.2 || isNearWhite(body);

  const details: string[] = [];
  details.push(
    bodyWhite
      ? "Fundalul paginii este alb."
      : `Fundal pagină: ${body ? toHex(body) : snap.bodyBg}.`,
  );
  details.push(
    footerKaki
      ? `Footer kaki (${snap.footerBg}).`
      : `Footer-ul nu este kaki-ul oficial #646B52 (am măsurat ${snap.footerBg || "gol"}).`,
  );
  if (uniqueForbidden.length) {
    details.push(
      `Culori de secțiune interzise (inclusiv griul #F3F4F6 care a picat auditul H1): ${uniqueForbidden.join(", ")}.`,
    );
  }

  let verdict: Verdict = "OK";
  if (uniqueForbidden.length >= 1) verdict = "KO";
  else if (!footerKaki || !bodyWhite) verdict = "PARTIAL";

  return result({
    id: "colors",
    number: 6,
    title: "Culori",
    officialName: "Branding – Colors",
    group: "tnp",
    verdict,
    summary:
      verdict === "OK"
        ? "Paleta vizibilă respectă kaki, alb, orange, terracotta."
        : "Apare gri / albastru / altă culoare de dealer, sau footer-ul nu e kaki.",
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
        hex: footer ? toHex(footer) : undefined,
        value: snap.footerBg,
      },
      { kind: "screenshot", label: "Homepage", screenshotId: "desktop" },
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
      ? "Există preț tăiat (strikethrough) — interzis în România pe acest parcurs."
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
  if (snap.smallTapTargets > 25) verdict = "KO";
  else if (snap.smallTapTargets > 12) verdict = "PARTIAL";
  return result({
    id: "q-tap",
    number: 22,
    title: "Ținte tactile",
    officialName: "Tap targets ≥ 48px",
    group: "quality",
    verdict,
    summary: `${snap.smallTapTargets} linkuri/butoane sub 44px pe mobil.`,
    details: [
      "Ghidul Dacia cere minim 48×48px. Un site de dealer 2026 pune Call / Programare în zona degetului mare.",
    ],
    evidence: [
      {
        kind: "metric",
        label: "Ținte mici",
        value: String(snap.smallTapTargets),
      },
    ],
    recommendation: "Măriți butoanele de telefon, meniu și CTA pe mobil.",
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
  const cityOk = Boolean(snap.header.cityLike) || /dacia/i.test(snap.title);
  const metaOk = snap.description.length > 40;
  const schemaOk = snap.jsonLdTypes.length > 0;
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
      metaOk ? "Meta description prezentă." : "Fără meta description utilă.",
      schemaOk
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
  if (ms != null && ms <= 1800) verdict = "OK";
  else if (ms != null && ms > 4000) verdict = "KO";
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
  if (snap.forms.length === 0) {
    return result({
      id: "q-forms",
      number: 29,
      title: "Formulare",
      officialName: "Note scurte GDPR pe formulare",
      group: "quality",
      verdict: "PARTIAL",
      summary: "Nu am găsit un formular pe pagina analizată.",
      details: ["Lead-ul de test drive / ofertă trebuie să fie la un tap distanță."],
      evidence: [],
      recommendation: "Formular scurt (3–5 câmpuri) cu notă operator / scop / drepturi.",
    });
  }
  const withGdpr = snap.forms.filter((f) => f.hasGdpr).length;
  const verdict: Verdict =
    withGdpr === snap.forms.length ? "OK" : withGdpr > 0 ? "PARTIAL" : "KO";
  return result({
    id: "q-forms",
    number: 29,
    title: "Formulare",
    officialName: "Note scurte GDPR pe formulare",
    group: "quality",
    verdict,
    summary: `${withGdpr}/${snap.forms.length} formulare cu notă de prelucrare date.`,
    details: snap.forms.map(
      (f, i) => `Formular ${i + 1}: ${f.fields} câmpuri${f.hasGdpr ? ", notă GDPR" : ", fără notă"}.`,
    ),
    evidence: [],
    recommendation:
      "Notă scurtă: operator, scop, drepturi, DPO. Consimțământ separat email/SMS.",
  });
}

function brandMixQuality(snap: Snapshot): CriterionResult {
  const inNav = snap.header.navLabels.some((l) => /renault|alpine|nissan/i.test(l));
  const phrases = snap.mixedBrandPhrases;
  const verdict: Verdict = phrases.length > 0 || inNav ? "KO" : "OK";
  return result({
    id: "q-mix",
    number: 30,
    title: "Pagină doar Dacia",
    officialName: "Fără puncte de acces către alte mărci",
    group: "quality",
    verdict,
    summary:
      verdict === "OK"
        ? "Pe pagina analizată nu apar CTA-uri clare către alte mărci."
        : `Amestec de mărci: ${snap.mixedBrandPhrases[0] || snap.otherBrands.join(", ")}.`,
    details: [
      "Homepage-ul multi-brand al agentului este permis. Pagina Dacia nu trebuie să trimită spre Renault / Alpine / altele.",
    ],
    evidence: snap.mixedBrandPhrases.slice(0, 3).map((q) => ({
      kind: "quote" as const,
      label: "Formulare mixtă",
      quote: q,
    })),
    recommendation:
      "Scoateți «Dacia și Renault» din footer, meniu și serviciile de pe pagina Dacia.",
  });
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

export function buildPitch(
  tnpScore: number,
  ko: number,
): { headline: string; body: string; urgency: string } {
  if (tnpScore >= 95 && ko === 0) {
    return {
      headline: "Conformitate website foarte bună — menținerea contează",
      body: `Scorul de pe grila website este ${tnpScore.toFixed(1).replace(".", ",")}%. Următorul val de audit este ${BRAND.nextAudit}. Un site ținut la zi (prețuri, oferte, standarde) evită o cădere între două valuri.`,
      urgency: `Auditul următor: ${BRAND.nextAudit}.`,
    };
  }
  if (tnpScore >= 80) {
    return {
      headline: "Aproape de 100% — punctele rămase se pierd la audit",
      body: `Pe astfel de detalii (culori, butoane, orar, URL) s-a pierdut punctaj în H1. Le putem închide pe un șablon deja aliniat după auditul din vară, gata în ${BRAND.delivery}.`,
      urgency: `Următorul audit de website este în ${BRAND.nextAudit}.`,
    };
  }
  return {
    headline: "Grila de website nu trece în forma actuală",
    body: `Un site Dacia pe standardele 2026, cu prețuri actualizate după catalogul public, costă ${BRAND.price}, tot inclus. Referințe: ${BRAND.portfolio.map((p) => p.name).join(" și ")}.`,
    urgency: `Valul următor de audit: ${BRAND.nextAudit}.`,
  };
}

export { DISCLAIMER };
