export type RGB = { r: number; g: number; b: number; a: number };

const KAKI: RGB = { r: 100, g: 107, b: 82, a: 1 };

export const FORBIDDEN_SECTION_HEX = new Set(
  [
    "#F3F4F6",
    "#F9FAFB",
    "#F5F5F5",
    "#EEEEEE",
    "#E5E7EB",
    "#F4F4F5",
    "#FAFAFA",
    "#F8F8F8",
    "#EFEFEF",
    "#F3F3F3",
    "#030F27",
    "#FDBE33",
    "#2563EB",
    "#1D4ED8",
    "#0D6EFD",
  ].map((h) => h.toUpperCase()),
);

export function parseCssColor(input: string | null | undefined): RGB | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s || s === "transparent" || s === "rgba(0, 0, 0, 0)") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const hex = s.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const n = parseInt(h.slice(0, 6), 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
      a: 1,
    };
  }
  const rgb = s.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] == null ? 1 : Number(rgb[4]),
    };
  }
  return null;
}

export function toHex(c: RGB): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`.toUpperCase();
}

export function dist(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export function isNearWhite(c: RGB): boolean {
  return c.a > 0.8 && c.r > 248 && c.g > 248 && bClose(c);
}

function bClose(c: RGB): boolean {
  return c.b > 248;
}

export function isKaki(c: RGB, threshold = 42): boolean {
  return c.a > 0.6 && dist(c, KAKI) <= threshold;
}

export function isForbiddenSection(c: RGB): boolean {
  if (c.a < 0.85) return false;
  const hex = toHex(c);
  if (FORBIDDEN_SECTION_HEX.has(hex)) return true;
  const gray =
    Math.abs(c.r - c.g) < 8 &&
    Math.abs(c.g - c.b) < 8 &&
    c.r >= 232 &&
    c.r <= 248 &&
    c.r < 252;
  return gray;
}

export function isDaciaButtonBg(c: RGB): boolean {
  if (c.a < 0.5) return true;
  if (isKaki(c, 50)) return true;
  if (dist(c, { r: 236, g: 101, b: 40, a: 1 }) < 50) return true;
  if (dist(c, { r: 185, g: 65, b: 45, a: 1 }) < 50) return true;
  if (c.r < 25 && c.g < 25 && c.b < 25) return true;
  if (isNearWhite(c)) return true;
  return false;
}

export function looksBlue(c: RGB): boolean {
  return c.b > c.r + 40 && c.b > c.g + 15 && c.b > 80;
}
