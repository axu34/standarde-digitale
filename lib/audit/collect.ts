import type { Page } from "playwright-core";
import type { Snapshot } from "./types";

const COLLECT_BODY = `
  function css(el, prop) {
    return el ? getComputedStyle(el).getPropertyValue(prop) : "";
  }
  function visible(el) {
    var s = getComputedStyle(el);
    var r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  }
  function textOf(el) {
    return ((el && el.textContent) || "").replace(/\\s+/g, " ").trim();
  }
  function inTopChrome(el) {
    if (!el || !visible(el)) return false;
    var r = el.getBoundingClientRect();
    return r.top < 150 && r.bottom > 0 && r.left >= 0 && r.left < window.innerWidth && r.height >= 8 && r.width >= 8;
  }

  var headerEl = document.querySelector("header") || document.querySelector('[role="banner"]') || document.querySelector("nav");
  var footerEl = document.querySelector("footer") || document.querySelector('[role="contentinfo"]');
  var bodyFont = css(document.body, "font-family");
  var navEl = document.querySelector("nav") || headerEl;
  var navFont = css(navEl, "font-family");
  var headingFonts = [];
  document.querySelectorAll("h1, h2, h3").forEach(function(el) {
    if (headingFonts.length < 12) headingFonts.push(css(el, "font-family"));
  });
  var allFonts = [bodyFont, navFont].concat(headingFonts);
  var headerBg = css(headerEl, "background-color") || css(document.body, "background-color");
  var headerText = textOf(headerEl).slice(0, 400);
  var navLabels = [];
  document.querySelectorAll("a, button").forEach(function(el) {
    if (!inTopChrome(el) || navLabels.length >= 16) return;
    var r = el.getBoundingClientRect();
    if (r.left < 160 || r.left > window.innerWidth * 0.72) return;
    var t = textOf(el);
    if (t.length > 1 && t.length < 42) navLabels.push(t);
  });
  var cityNames = ["Târgoviște","Targoviste","Drăgășani","Dragasani","București","Bucuresti","Cluj-Napoca","Cluj","Timișoara","Timisoara","Iași","Iasi","Constanța","Constanta","Craiova","Brașov","Brasov","Oradea","Arad","Pitești","Pitesti","Sibiu","Baia Mare","Călărași","Calarasi","Alexandria","Drobeta","Târgu Jiu","Targu Jiu","Alba Iulia","Orăștie","Orastie","Slatina","Râmnicu Vâlcea","Ramnicu Valcea","Ploiești","Ploiesti","Buzău","Buzau","Focșani","Focsani","Galați","Galati","Brăila","Braila","Suceava","Botoșani","Botosani","Piatra Neamț","Piatra Neamt","Bacău","Bacau","Deva","Hunedoara","Reșița","Resita","Satu Mare","Zalău","Zalau","Sfântu Gheorghe","Sfantu Gheorghe","Miercurea Ciuc","Odorheiu Secuiesc","Odorheiu","Târgu Mureș","Targu Mures"];
  var cityHay = headerText + " " + (document.title || "");
  var cityLike = null;
  for (var ci = 0; ci < cityNames.length; ci++) {
    if (cityHay.toLowerCase().indexOf(cityNames[ci].toLowerCase()) !== -1) { cityLike = cityNames[ci]; break; }
  }
  var rightHalf = window.innerWidth * 0.55;
  var agentCandidates = [];
  document.querySelectorAll("a[href]").forEach(function(a) {
    if (!inTopChrome(a)) return;
    var r = a.getBoundingClientRect();
    if (r.left + r.width / 2 < rightHalf) return;
    var img = a.querySelector("img, svg, [class*='logo' i]");
    var t = textOf(a).slice(0, 80);
    if (!img && /promot|vehicul|servicii|rabla|ofert|gama|contact|dacia|home|meniu/i.test(t)) return;
    if (img || (t.length > 1 && t.length < 48)) {
      agentCandidates.push({ href: a.href, target: a.target || "", text: t, hasImage: !!img, x: r.left });
    }
  });
  agentCandidates.sort(function(a, b) {
    if (a.hasImage !== b.hasImage) return a.hasImage ? -1 : 1;
    return b.x - a.x;
  });
  var agent = agentCandidates[0] || null;
  if (!agent) {
    document.querySelectorAll("img, svg").forEach(function(img) {
      if (agent || !inTopChrome(img)) return;
      var r = img.getBoundingClientRect();
      if (r.left < rightHalf || r.width < 28 || r.width > 280) return;
      var label = (img.getAttribute("alt") || img.getAttribute("aria-label") || "logo agent").slice(0, 80);
      if (/^dacia$/i.test(label.trim())) return;
      agent = { href: "", target: "", text: label, hasImage: true, x: r.left };
    });
  }

  var sectionBgs = [];
  var scanned = 0;
  document.querySelectorAll("section, main, article, div").forEach(function(el) {
    if (scanned > 50) return;
    if (!visible(el)) return;
    var r = el.getBoundingClientRect();
    if (r.height < 160 || r.width < 400) return;
    var pos = css(el, "position");
    if (pos === "fixed" || pos === "sticky") return;
    var bg = css(el, "background-color");
    if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") return;
    sectionBgs.push({ bg: bg, h: Math.round(r.height), w: Math.round(r.width) });
    scanned += 1;
  });

  var buttons = [];
  document.querySelectorAll("a, button, input[type='submit'], [class*='btn'], [class*='cta']").forEach(function(el) {
    if (!visible(el) || buttons.length >= 40) return;
    var r = el.getBoundingClientRect();
    if (r.height < 28 || r.height > 72 || r.width < 70 || r.width > 420) return;
    buttons.push({
      text: textOf(el).slice(0, 60),
      radius: parseFloat(css(el, "border-radius")) || 0,
      bg: css(el, "background-color"),
      color: css(el, "color"),
      font: css(el, "font-family"),
      width: Math.round(r.width),
      height: Math.round(r.height)
    });
  });

  var lucideCount = document.querySelectorAll("svg.lucide, [class*='lucide']").length;
  var pageText = (document.body.innerText || "").replace(/\\s+/g, " ");
  var modelDefs = [
    { key: "noul-spring", label: "Noul Spring", re: /noul\\s+spring/gi },
    { key: "spring", label: "Spring", re: /\\bspring\\b/gi },
    { key: "stepway", label: "Stepway", re: /\\bstepway\\b/gi },
    { key: "sandero", label: "Sandero", re: /\\bsandero\\b/gi },
    { key: "logan", label: "Logan", re: /\\blogan\\b/gi },
    { key: "jogger", label: "Jogger", re: /\\bjogger\\b/gi },
    { key: "duster", label: "Duster", re: /\\bduster\\b/gi },
    { key: "bigster", label: "Bigster", re: /\\bbigster\\b/gi },
    { key: "striker", label: "Striker", re: /\\bstriker\\b/gi }
  ];
  var models = [];
  modelDefs.forEach(function(m) {
    var match = m.re.exec(pageText);
    if (!match) return;
    var idx = match.index;
    var around = pageText.slice(Math.max(0, idx - 40), idx + 280);
    var price = around.match(/de la[^0-9]{0,16}(\\d{1,3}(?:[.\\s]\\d{3})+|\\d{4,6})\\s*(?:€|EUR|euro)?/i) || around.match(/(\\d{1,3}(?:[.\\s]\\d{3})+|\\d{4,6})\\s*(?:€|EUR|euro)/i);
    models.push({
      key: m.key,
      label: m.label,
      firstIndex: idx,
      hasPrice: !!price,
      priceText: price ? price[0] : null,
      hasStrikethrough: /line-through|tăiat|taiat/i.test(around)
    });
  });
  var modelOrder = models.slice().sort(function(a, b) { return a.firstIndex - b.firstIndex; }).map(function(m) { return m.key; }).filter(function(k, i, arr) { return arr.indexOf(k) === i; });

  var pricesOnPage = [];
  var priceRe = /(?:de la\\s*)?(\\d{1,3}(?:[.\\s]\\d{3})+|\\d{4,6})\\s*(?:€|EUR|euro)/gi;
  var pm;
  while ((pm = priceRe.exec(pageText)) && pricesOnPage.length < 20) pricesOnPage.push(pm[0]);

  var hasStrikethroughPrice = false;
  document.querySelectorAll("s, del, [class*='line-through']").forEach(function(el) {
    if (/\\d{2,}.{0,8}(€|EUR|euro)/i.test(textOf(el))) hasStrikethroughPrice = true;
  });

  var imgs = [].slice.call(document.querySelectorAll("img"));
  var hero = null;
  for (var i = 0; i < imgs.length; i++) {
    var ir = imgs[i].getBoundingClientRect();
    if (ir.top < 900 && ir.width > 480 && ir.height > 160) { hero = imgs[i]; break; }
  }

  var hasRangeBlock = models.length >= 3 || /gama|vehicule noi|modele/i.test(pageText.slice(0, 4000));
  var hasServicesBlock = /servicii|vânzări mașini noi|vanzari masini noi|service|itinichigerie|itp|garanție|garantie/i.test(pageText);
  var serviceTitles = [];
  document.querySelectorAll("h2, h3, summary, [class*='service']").forEach(function(el) {
    var t = textOf(el);
    if (serviceTitles.length < 12 && t.length > 4 && t.length < 80 && /service|vânz|vanz|itp|revizie|caros|finan|garan/i.test(t)) serviceTitles.push(t);
  });
  var hasNewCarSales = /vânzări mașini noi|vanzari masini noi|vânzare vehicule noi|vanzare vehicule noi|vehicule noi|vânzări auto noi|vanzari auto noi|mașini noi|masini noi/i.test(pageText);
  var hoursMentions = [];
  var hoursRe = /(?:orar|program)[^.]{0,90}|(?:luni|marți|marti|miercuri|joi|vineri)[\\s–,—-]+(?:vineri|sâmbătă|sambata|duminică|duminica)?[^.]{0,50}\\d{1,2}[:.h]\\d{2}|\\d{1,2}[:.]\\d{2}\\s*[–-]\\s*\\d{1,2}[:.]\\d{2}/gi;
  var hm;
  while ((hm = hoursRe.exec(pageText)) && hoursMentions.length < 8) {
    var chunk = hm[0].slice(0, 120).trim();
    if (chunk.length > 8) hoursMentions.push(chunk);
  }

  var accordionHint = !!(document.querySelector("details, [aria-expanded], [class*='accordion']"));
  var cookieEl = null;
  document.querySelectorAll('[id*="cookie" i], [class*="cookie" i], [class*="consent" i], #onetrust-banner-sdk, #cc-main, [class*="didomi"]').forEach(function(el) {
    if (!cookieEl && visible(el)) cookieEl = el;
  });
  if (!cookieEl && /cookie/i.test(pageText.slice(0, 8000))) {
    cookieEl = { skip: true };
  }

  var hrefs = [].slice.call(document.querySelectorAll("a[href]")).map(function(a) { return a.href; });
  var legal = {
    cookies: hrefs.some(function(h) { return /cookie/i.test(h); }) || /politica de cookie|cookie policy|politica cookies/i.test(pageText),
    privacy: hrefs.some(function(h) { return /confidentialitate|privacy|date-personale|politica-de-conf/i.test(h); }) || /politica de confiden|privacy policy|date personale/i.test(pageText),
    terms: hrefs.some(function(h) { return /termeni|terms|conditii/i.test(h); }) || /termeni și condiții|termeni si conditii/i.test(pageText),
    anpc: hrefs.some(function(h) { return /anpc/i.test(h); }) || /\\bANPC\\b/.test(pageText)
  };
  var privacyHref = null;
  for (var p = 0; p < hrefs.length; p++) {
    if (/confidentialitate|privacy|date-personale/i.test(hrefs[p])) { privacyHref = hrefs[p]; break; }
  }

  var brandNames = ["Renault","Alpine","Nissan","Ford","Volkswagen","Škoda","Skoda","Seat","Peugeot","Opel","Toyota","Hyundai","Kia","Mercedes","BMW","Audi"];
  var pageTextBrands = pageText.replace(/renault group/gi, "");
  var otherBrands = brandNames.filter(function(b) { return new RegExp("\\\\b" + b + "\\\\b", "i").test(pageTextBrands); });
  var mixedBrandPhrases = [];
  var mixRe = /dacia\\s*(?:și|&|\\/)\\s*renault|renault\\s*(?:și|&|\\/)\\s*dacia|reprezentan(?:ță|ta)\\s+dacia\\s*(?:și|&)\\s*renault|dealer dacia și renault|service dacia și renault/gi;
  var mx;
  while ((mx = mixRe.exec(pageText)) && mixedBrandPhrases.length < 6) mixedBrandPhrases.push(mx[0]);

  var telLinks = hrefs.filter(function(h) { return h.indexOf("tel:") === 0; }).slice(0, 8);
  var hasMailto = hrefs.some(function(h) { return h.indexOf("mailto:") === 0; });
  var hasMaps = hrefs.some(function(h) { return /maps\\.google|google\\.[^/]+\\/maps|goo\\.gl\\/maps/i.test(h); });

  var jsonLdTypes = [];
  var jsonLdName = null;
  var schemaAutoDealer = false;
  function walkLd(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(walkLd); return; }
    if (node["@graph"]) walkLd(node["@graph"]);
    var t = node["@type"];
    if (!t) return;
    var types = Array.isArray(t) ? t.map(String) : [String(t)];
    jsonLdTypes.push(types.join(","));
    var joined = types.join(" ");
    if (/AutoDealer|CarDealer/i.test(joined)) schemaAutoDealer = true;
    if (!jsonLdName && node.name && /AutoDealer|CarDealer|AutoRepair|LocalBusiness|Organization/i.test(joined)) {
      jsonLdName = String(node.name).slice(0, 80);
    }
    var hours = node.openingHours || node.openingHoursSpecification;
    if (typeof hours === "string" && hoursMentions.length < 8) hoursMentions.push(hours.slice(0, 120));
    if (Array.isArray(hours)) {
      hours.slice(0, 4).forEach(function(h) {
        if (typeof h === "string") hoursMentions.push(h.slice(0, 120));
        else if (h && h.opens) hoursMentions.push((h.dayOfWeek || "") + " " + h.opens + "–" + (h.closes || ""));
      });
    }
    if (node.telephone && telLinks.length === 0) {
      var tel = String(node.telephone).replace(/\\s+/g, "");
      if (tel) telLinks.push("tel:" + tel);
    }
  }
  document.querySelectorAll('script[type="application/ld+json"]').forEach(function(script) {
    try { walkLd(JSON.parse(script.textContent || "null")); } catch (e) {}
  });

  var headings = [];
  document.querySelectorAll("h1, h2, h3, h4").forEach(function(el) {
    if (headings.length < 30) headings.push({ level: Number(el.tagName.slice(1)), text: textOf(el).slice(0, 90) });
  });
  var missingAlt = imgs.filter(function(img) { return !img.getAttribute("alt") && visible(img); }).length;
  var overflowX = document.documentElement.scrollWidth > window.innerWidth + 12;
  var smallTapTargets = 0;
  document.querySelectorAll("a[href^='tel:'], button, input[type='submit']").forEach(function(el) {
    if (!visible(el)) return;
    if (headerEl && headerEl.contains(el) && !(el.getAttribute && (el.getAttribute("href") || "").indexOf("tel:") === 0)) return;
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) smallTapTargets += 1;
  });
  var forms = [];
  document.querySelectorAll("form").forEach(function(form) {
    if (forms.length >= 8) return;
    var fields = form.querySelectorAll("input:not([type='hidden']), textarea, select").length;
    if (fields < 3) return;
    var t = (textOf(form) + " " + textOf(form.parentElement)).toLowerCase();
    forms.push({
      fields: fields,
      hasGdpr: /gdpr|date personale|consimț|consimt|politica de conf|operator de date|prelucr/i.test(t)
    });
  });
  var u = location.href;
  var loadMs = null;
  var nav = performance.getEntriesByType("navigation")[0];
  if (nav) loadMs = Math.round(nav.domContentLoadedEventEnd);
  var faviconEl = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
  var favicon = faviconEl ? faviconEl.getAttribute("href") : null;
  var appleEl = document.querySelector('link[rel="apple-touch-icon"]');
  var appleTouchHref = appleEl && appleEl.getAttribute("href") ? new URL(appleEl.getAttribute("href"), document.baseURI).toString() : null;

  return {
    url: u,
    title: document.title || "",
    description: (document.querySelector('meta[name="description"]') && document.querySelector('meta[name="description"]').getAttribute("content")) || "",
    canonical: (document.querySelector('link[rel="canonical"]') && document.querySelector('link[rel="canonical"]').getAttribute("href")) || null,
    lang: document.documentElement.lang || null,
    viewportMeta: (document.querySelector('meta[name="viewport"]') && document.querySelector('meta[name="viewport"]').getAttribute("content")) || null,
    faviconHref: favicon ? new URL(favicon, document.baseURI).toString() : null,
    themeColor: (document.querySelector('meta[name="theme-color"]') && document.querySelector('meta[name="theme-color"]').getAttribute("content")) || null,
    https: location.protocol === "https:",
    bodyFont: bodyFont,
    navFont: navFont,
    headingFonts: headingFonts,
    allFonts: allFonts,
    bodyBg: css(document.body, "background-color"),
    header: {
      bg: headerBg,
      text: headerText,
      navLabels: navLabels,
      hasDaciaWord: /dacia/i.test(headerText + document.title),
      cityLike: cityLike,
      agent: agent ? { href: agent.href, target: agent.target, text: agent.text, hasImage: agent.hasImage } : null
    },
    footerBg: (function() {
      var painted = css(footerEl, "background-color");
      var pageH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      document.querySelectorAll("footer, [role='contentinfo'], div, section").forEach(function(el) {
        var r = el.getBoundingClientRect();
        var top = r.top + (window.scrollY || 0);
        if (r.height < 70 || r.width < 280 || top < pageH * 0.62) return;
        var bg = css(el, "background-color");
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") painted = bg;
      });
      return painted;
    })(),
    footerText: textOf(footerEl).slice(0, 500),
    sectionBgs: sectionBgs,
    buttons: buttons,
    lucideCount: lucideCount,
    models: models,
    modelOrder: modelOrder,
    pricesOnPage: pricesOnPage,
    hasStrikethroughPrice: hasStrikethroughPrice,
    hasHeroImage: !!hero,
    hasRangeBlock: hasRangeBlock,
    hasServicesBlock: hasServicesBlock,
    serviceTitles: serviceTitles,
    hasNewCarSales: hasNewCarSales,
    hoursMentions: hoursMentions,
    accordionHint: accordionHint,
    cookieBanner: { found: !!cookieEl, text: cookieEl && cookieEl.tagName ? textOf(cookieEl).slice(0, 180) : (cookieEl ? "cookie mention in page" : null) },
    legal: legal,
    privacyHref: privacyHref,
    otherBrands: otherBrands,
    mixedBrandPhrases: mixedBrandPhrases,
    telLinks: telLinks,
    hasMailto: hasMailto,
    hasMaps: hasMaps,
    jsonLdTypes: jsonLdTypes,
    jsonLdName: jsonLdName,
    schemaAutoDealer: schemaAutoDealer,
    appleTouchHref: appleTouchHref,
    headings: headings,
    imageCount: imgs.length,
    missingAlt: missingAlt,
    overflowX: overflowX,
    smallTapTargets: smallTapTargets,
    forms: forms,
    daciaInUrl: /dacia/i.test(u),
    cityInUrl: /dacia-[a-z0-9-]{3,}/i.test(u),
    loadMs: loadMs,
    mixedContent: document.querySelectorAll("img[src^='http:']").length > 0
  };
`;

export async function collectSnapshot(page: Page): Promise<Snapshot> {
  const collectFn = new Function(COLLECT_BODY) as () => Snapshot;
  return page.evaluate(collectFn);
}
