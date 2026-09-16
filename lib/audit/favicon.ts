import { PNG } from "pngjs";
import type { FaviconAnalysis } from "./types";
import { dist, type RGB } from "./colors";

const KAKI: RGB = { r: 100, g: 107, b: 82, a: 1 };

export async function analyzeFavicon(
  href: string | null,
  pageOrigin: string,
  extras: (string | null | undefined)[] = [],
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
  try {
    const ico = new URL("/favicon.ico", pageOrigin).toString();
    if (!seen.has(ico)) candidates.push(ico);
  } catch {
    /* skip */
  }

  if (!candidates.length) {
    return {
      href: null,
      kakiLike: null,
      averageHex: null,
      note: "Nu am găsit un favicon declarat.",
    };
  }

  let lastNote = "Faviconul nu a putut fi citit.";
  for (const abs of candidates) {
    const one = await readFavicon(abs);
    if (one.kakiLike != null) return one;
    lastNote = one.note;
  }
  return {
    href: candidates[0],
    kakiLike: null,
    averageHex: null,
    note: lastNote,
  };
}

async function readFavicon(abs: string): Promise<FaviconAnalysis> {
  try {
    const res = await fetch(abs, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "image/*,*/*" },
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
    const type = res.headers.get("content-type") || "";
    if (!type.includes("png") && buf[0] !== 0x89) {
      return {
        href: abs,
        kakiLike: null,
        averageHex: null,
        note: "Faviconul nu este PNG — nu pot confirma emblema albă pe kaki.",
      };
    }
    const png = PNG.sync.read(buf);
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const a = png.data[i + 3];
      if (a < 40) continue;
      r += png.data[i];
      g += png.data[i + 1];
      b += png.data[i + 2];
      n += 1;
    }
    if (!n) {
      return {
        href: abs,
        kakiLike: false,
        averageHex: null,
        note: "Favicon gol sau transparent.",
      };
    }
    const avg: RGB = { r: r / n, g: g / n, b: b / n, a: 1 };
    const hex = `#${[avg.r, avg.g, avg.b]
      .map((x) => Math.round(x).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;
    const kakiLike = dist(avg, KAKI) < 70;
    return {
      href: abs,
      kakiLike,
      averageHex: hex,
      note: kakiLike
        ? `Culoarea medie ${hex} este apropiată de kaki #646B52.`
        : `Culoarea medie ${hex} nu este kaki-ul oficial #646B52.`,
    };
  } catch {
    return {
      href: abs,
      kakiLike: null,
      averageHex: null,
      note: "Faviconul nu a putut fi citit.",
    };
  }
}
