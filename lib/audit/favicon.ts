import { PNG } from "pngjs";
import type { Page } from "playwright-core";
import type { FaviconAnalysis } from "./types";
import { dist, isKaki, parseCssColor, toHex, type RGB } from "./colors";

const KAKI: RGB = { r: 100, g: 107, b: 82, a: 1 };

export async function analyzeFavicon(
  href: string | null,
  pageOrigin: string,
  extras: (string | null | undefined)[] = [],
  page?: Page,
): Promise<FaviconAnalysis> {
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const raw of [href, ...extras]) {
    if (!raw) continue;
    try {
      const abs = new URL(raw, pageOrigin).toString();
      if (!seen.has(abs)) {
        seen.add(abs);
        candidates.push(abs);
      }
    } catch {
      /* skip */
    }
  }

  if (!candidates.length) {
    try {
      const ico = new URL("/favicon.ico", pageOrigin).toString();
      candidates.push(ico);
    } catch {
      /* skip */
    }
  }

  if (!candidates.length) {
    return {
      href: null,
      kakiLike: null,
      averageHex: null,
      note: "Nu am găsit un favicon declarat pe pagina Dacia.",
    };
  }

  let last: FaviconAnalysis = {
    href: candidates[0],
    kakiLike: null,
    averageHex: null,
    note: "Faviconul nu a putut fi citit.",
  };

  for (const abs of candidates) {
    const one = await readFavicon(abs);
    last = one;
    if (one.kakiLike === true) return one;
    if (one.kakiLike === false && !/nu a putut|inaccesibil/i.test(one.note)) {
      return one;
    }
  }

  if (page) {
    const raster = await rasterizeFavicon(page, candidates[0]);
    if (raster) return raster;
  }

  return last;
}

export function interpretFaviconBytes(
  buf: Buffer,
  href: string,
  contentType: string,
): FaviconAnalysis {
  const type = contentType.toLowerCase();
  const asText = buf.toString("utf8");

  if (
    type.includes("svg") ||
    asText.trimStart().startsWith("<svg") ||
    asText.includes("http://www.w3.org/2000/svg")
  ) {
    return interpretSvg(asText, href);
  }

  const pngBuf = pngFromIcoOrPng(buf);
  if (pngBuf) {
    return interpretPng(pngBuf, href);
  }

  if (type.includes("jpeg") || type.includes("jpg") || buf[0] === 0xff) {
    return {
      href,
      kakiLike: null,
      averageHex: null,
      note: "Favicon JPEG — am nevoie de rasterizare ca să confirm kakiul.",
    };
  }

  return {
    href,
    kakiLike: null,
    averageHex: null,
    note: "Faviconul nu este PNG/SVG — nu pot confirma emblema albă pe kaki doar din fișier.",
  };
}

function interpretSvg(text: string, href: string): FaviconAnalysis {
  const fills = [
    ...text.matchAll(/fill\s*=\s*["']([^"']+)["']/gi),
    ...text.matchAll(/stop-color\s*=\s*["']([^"']+)["']/gi),
    ...text.matchAll(/<svg[^>]*style=["'][^"']*background[^:]*:\s*([^;"']+)/gi),
  ]
    .map((m) => parseCssColor(m[1]))
    .filter((c): c is RGB => c != null && c.a > 0.2);

  const unique = [...new Set(fills.map((c) => toHex(c)))];
  const kaki = fills.some((c) => isKaki(c, 55));
  if (kaki) {
    return {
      href,
      kakiLike: true,
      averageHex: "#646B52",
      note: `Favicon SVG cu fill kaki (${unique.join(", ")}).`,
    };
  }
  const hexList = unique.join(", ") || "fără fill opac";
  return {
    href,
    kakiLike: false,
    averageHex: unique[0] || null,
    note: `Favicon SVG: ${hexList}. Ghidul cere emblema albă pe kaki #646B52, nu wordmark-ul Dacia.`,
  };
}

function pngFromIcoOrPng(buf: Buffer): Buffer | null {
  if (buf[0] === 0x89 && buf[1] === 0x50) return buf;
  const idx = buf.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (idx >= 0) return buf.subarray(idx);
  return null;
}

function interpretPng(buf: Buffer, href: string): FaviconAnalysis {
  const png = PNG.sync.read(buf);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  let kakiPixels = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3];
    if (a < 40) continue;
    const pixel: RGB = {
      r: png.data[i],
      g: png.data[i + 1],
      b: png.data[i + 2],
      a: 1,
    };
    if (isKaki(pixel, 48)) kakiPixels += 1;
    r += pixel.r;
    g += pixel.g;
    b += pixel.b;
    n += 1;
  }
  if (!n) {
    return {
      href,
      kakiLike: false,
      averageHex: null,
      note: "Favicon gol sau transparent.",
    };
  }
  const avg: RGB = { r: r / n, g: g / n, b: b / n, a: 1 };
  const hex = toHex(avg);
  const kakiShare = kakiPixels / n;
  const kakiLike = dist(avg, KAKI) < 70 || kakiShare > 0.28;
  return {
    href,
    kakiLike,
    averageHex: hex,
    note: kakiLike
      ? `Culoarea medie ${hex} este apropiată de kaki #646B52.`
      : `Culoarea medie ${hex} nu este kaki-ul oficial #646B52.`,
  };
}

async function readFavicon(abs: string): Promise<FaviconAnalysis> {
  try {
    const res = await fetch(abs, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "image/*,image/svg+xml,*/*" },
    });
    if (!res.ok) {
      return {
        href: abs,
        kakiLike: null,
        averageHex: null,
        note: `Favicon inaccesibil (${res.status}).`,
      };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return interpretFaviconBytes(buf, abs, res.headers.get("content-type") || "");
  } catch {
    return {
      href: abs,
      kakiLike: null,
      averageHex: null,
      note: "Faviconul nu a putut fi citit.",
    };
  }
}

async function rasterizeFavicon(page: Page, href: string): Promise<FaviconAnalysis | null> {
  try {
    const stats = await page.evaluate(async (url: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img"));
        img.src = url;
      });
      const w = Math.min(64, Math.max(16, img.naturalWidth || 32));
      const h = Math.min(64, Math.max(16, img.naturalHeight || 32));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 40) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      if (!n) return null;
      return { r: r / n, g: g / n, b: b / n };
    }, href);
    if (!stats) return null;
    const avg: RGB = { r: stats.r, g: stats.g, b: stats.b, a: 1 };
    const hex = toHex(avg);
    const kakiLike = dist(avg, KAKI) < 70;
    return {
      href,
      kakiLike,
      averageHex: hex,
      note: kakiLike
        ? `Favicon rasterizat: media ${hex}, aproape de kaki.`
        : `Favicon rasterizat: media ${hex}, nu kaki #646B52.`,
    };
  } catch {
    return null;
  }
}
