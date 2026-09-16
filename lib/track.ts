import { nanoid } from "nanoid";
import { loadJson, listJson, loadReport, putJson } from "@/lib/audit/store";
import { sendViewAlert } from "@/lib/email";

export type MailToken = {
  token: string;
  reportId: string;
  to: string;
  dealer: string;
  city: string;
  createdAt: string;
  openedAt?: string;
  pixelAt?: string;
  viewCount: number;
};

export type ActivityEvent = {
  id: string;
  at: string;
  kind: "page" | "pixel";
  reportId: string;
  token?: string;
  to?: string;
  dealer?: string;
  city?: string;
  ua?: string;
  referrer?: string;
};

const BOT =
  /bot|crawl|spider|preview|facebookexternal|whatsapp|telegram|slack|discord|linkedin|twitter|embedly|quora|pinterest|google-inspection|lighthouse|headless|bytespider|semrush|ahrefs/i;

export function isBot(ua: string, purpose: string): boolean {
  if (BOT.test(ua)) return true;
  if (/prefetch/i.test(purpose)) return true;
  return false;
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://standarde-digitale.vercel.app").replace(
    /\/$/,
    "",
  );
}

export async function createMailToken(input: {
  reportId: string;
  to: string;
  dealer: string;
  city: string;
}): Promise<MailToken> {
  const token: MailToken = {
    token: nanoid(12),
    reportId: input.reportId,
    to: input.to.trim().toLowerCase(),
    dealer: input.dealer,
    city: input.city,
    createdAt: new Date().toISOString(),
    viewCount: 0,
  };
  await putJson(`mail/${token.token}.json`, token);
  return token;
}

export function trackedReportUrl(reportId: string, token: string): string {
  return `${siteOrigin()}/raport/${reportId}?m=${encodeURIComponent(token)}`;
}

export function pixelUrl(token: string): string {
  return `${siteOrigin()}/t/${token}`;
}

export async function recordView(input: {
  reportId: string;
  token?: string | null;
  kind: "page" | "pixel";
  ua?: string;
  referrer?: string;
  purpose?: string;
}): Promise<{ recorded: boolean; firstOpen: boolean; mail?: MailToken }> {
  const ua = input.ua || "";
  if (isBot(ua, input.purpose || "")) return { recorded: false, firstOpen: false };

  let mail: MailToken | null = null;
  if (input.token && /^[A-Za-z0-9_-]{6,40}$/.test(input.token)) {
    mail = await loadJson<MailToken>(`mail/${input.token}.json`);
  }

  const reportId = mail?.reportId || input.reportId;
  if (!reportId || !/^[A-Za-z0-9_-]{6,40}$/.test(reportId)) {
    return { recorded: false, firstOpen: false };
  }

  const firstOpen = Boolean(mail && input.kind === "page" && !mail.openedAt);
  if (mail) {
    mail.viewCount += 1;
    if (input.kind === "page" && !mail.openedAt) mail.openedAt = new Date().toISOString();
    if (input.kind === "pixel" && !mail.pixelAt) mail.pixelAt = new Date().toISOString();
    await putJson(`mail/${mail.token}.json`, mail);
  }

  const event: ActivityEvent = {
    id: nanoid(10),
    at: new Date().toISOString(),
    kind: input.kind,
    reportId,
    token: mail?.token,
    to: mail?.to,
    dealer: mail?.dealer,
    city: mail?.city,
    ua: ua.slice(0, 180),
    referrer: (input.referrer || "").slice(0, 200),
  };
  await putJson(`activity/${event.at.slice(0, 19).replace(/[:T]/g, "")}-${event.id}.json`, event);

  if (firstOpen && mail) {
    const report = await loadReport(reportId);
    await sendViewAlert({
      to: mail.to,
      dealer: mail.dealer || report?.dealerGuess || "Dealer",
      city: mail.city || report?.cityGuess || "",
      reportUrl: trackedReportUrl(reportId, mail.token),
      score: report?.tnpLabel || "—",
    }).catch(() => false);
  }

  return { recorded: true, firstOpen, mail: mail || undefined };
}

export async function listActivity(limit = 60): Promise<ActivityEvent[]> {
  const items = await listJson<ActivityEvent>("activity/", limit);
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}
