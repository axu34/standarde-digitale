const hits = new Map<string, number[]>();

export function rateLimit(ip: string, max = 8, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (prev.length >= max) {
    hits.set(ip, prev);
    return false;
  }
  prev.push(now);
  hits.set(ip, prev);
  return true;
}
