const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function normalizeInputUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Introduceți adresa site-ului.");
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    throw new Error("Adresa nu este un URL valid.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Sunt acceptate doar adrese http(s).");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || isPrivateIPv4(host)) {
    throw new Error("Această adresă nu poate fi verificată.");
  }
  return url.toString();
}
