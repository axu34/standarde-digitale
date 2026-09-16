import type { Page } from "playwright-core";

function scoreCandidate(href: string): number {
  let score = 0;
  try {
    const u = new URL(href);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host.startsWith("dacia.") || host.includes("dacia-")) score += 40;
    if (path.includes("/dacia")) score += 30;
    if (/dacia-[a-z0-9-]{3,}/.test(`${host}${path}`)) score += 25;
    if (path === "/dacia" || path === "/dacia/") score += 10;
    if (u.hash) score -= 5;
  } catch {
    return -1;
  }
  return score;
}

export function urlLooksDacia(href: string): boolean {
  try {
    const u = new URL(href);
    return /dacia/i.test(u.hostname + u.pathname);
  } catch {
    return /dacia/i.test(href);
  }
}

export async function resolveDaciaUrl(
  page: Page,
  startUrl: string,
): Promise<{ analyzed: string; homepage: string; switched: boolean }> {
  const homepage = startUrl;
  if (urlLooksDacia(page.url()) || urlLooksDacia(startUrl)) {
    return { analyzed: page.url() || startUrl, homepage, switched: false };
  }

  const hrefs = (await page.evaluate(
    `Array.from(document.querySelectorAll("a[href]")).map(function(a){return a.href;}).filter(function(h){return /dacia/i.test(h);})`,
  )) as string[];

  const unique = [...new Set(hrefs)].filter((h) => scoreCandidate(h) > 0);
  unique.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  const best = unique[0];
  if (!best) {
    return { analyzed: page.url() || startUrl, homepage, switched: false };
  }

  await page.goto(best, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  return { analyzed: page.url(), homepage, switched: true };
}
