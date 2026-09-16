import { BRAND } from "@/lib/brand";

const FROM = `${BRAND.fromName} <${BRAND.fromEmail}>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send(payload: {
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || FROM,
      to: payload.to,
      reply_to: payload.replyTo || BRAND.email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });
  return res.ok;
}

export async function sendLeadNotification(input: {
  name: string;
  dealer: string;
  phone: string;
  email: string;
  message: string;
  reportId?: string;
  score?: string;
  url?: string;
  reportUrl?: string;
}): Promise<boolean> {
  const to = process.env.LEAD_TO_EMAIL || BRAND.email;
  const lines = [
    `${input.name} / ${input.dealer || "—"}`,
    `Tel: ${input.phone || "—"}`,
    `Email: ${input.email || "—"}`,
    `Site: ${input.url || "—"}`,
    `Scor: ${input.score || "—"}`,
    input.reportUrl ? `Raport: ${input.reportUrl}` : `Raport: ${input.reportId || "—"}`,
    "",
    input.message || "",
  ];
  const text = lines.join("\n");
  const html = `<p>${escapeHtml(input.name)} / ${escapeHtml(input.dealer || "—")}</p>
<p>Tel: ${escapeHtml(input.phone || "—")}<br>Email: ${escapeHtml(input.email || "—")}</p>
<p>Site: ${escapeHtml(input.url || "—")}<br>Scor: ${escapeHtml(input.score || "—")}</p>
${input.reportUrl ? `<p><a href="${escapeHtml(input.reportUrl)}">${escapeHtml(input.reportUrl)}</a></p>` : ""}
<p>${escapeHtml(input.message || "")}</p>`;

  return send({
    to: [to],
    subject: `Cerere site Dacia — ${input.dealer || input.name}`,
    text,
    html,
  });
}

export async function sendViewAlert(input: {
  to: string;
  dealer: string;
  city: string;
  reportUrl: string;
  score: string;
}): Promise<boolean> {
  const inbox = process.env.LEAD_TO_EMAIL || BRAND.email;
  const who = [input.dealer, input.city].filter((x) => x && x !== "—").join(" · ");
  const subject = who
    ? `${who} a deschis raportul (${input.score})`
    : `Raport deschis (${input.score})`;
  const text = `${input.to} a deschis raportul.

${input.reportUrl}

Scor: ${input.score}

E momentul bun de follow-up: un telefon sau un mail scurt, cât e încă pe pagină.
`;
  const html = `<p><strong>${escapeHtml(input.to)}</strong> a deschis raportul${who ? ` — ${escapeHtml(who)}` : ""}.</p>
<p>Scor: ${escapeHtml(input.score)}</p>
<p><a href="${escapeHtml(input.reportUrl)}">${escapeHtml(input.reportUrl)}</a></p>
<p>Follow-up acum: un telefon sau un mail scurt, cât e încă pe pagină.</p>`;
  return send({ to: [inbox], subject, text, html });
}

export async function sendReportToDealer(input: {
  to: string;
  dealer: string;
  city: string;
  score: string;
  reportUrl: string;
  analyzedUrl: string;
  pixelUrl?: string;
}): Promise<boolean> {
  const who = [input.dealer, input.city].filter((x) => x && x !== "—").join(" · ");
  const subject = who
    ? `Raport site Dacia — ${who} (${input.score})`
    : `Raport site Dacia — ${input.score}`;
  const text = `Bună,

Raportul pentru ${input.analyzedUrl} este aici:
${input.reportUrl}

Scor website: ${input.score}

Este o analiză independentă, nu un audit oficial Dacia. Dacă vreți să vorbim despre ce rămâne de făcut: ${BRAND.phoneDisplay} sau ${BRAND.email}.

Alexandru Drăghici
${BRAND.agency}
${BRAND.agencyUrl}
`;
  const html = `<p>Bună,</p>
<p>Raportul pentru ${escapeHtml(input.analyzedUrl)} este aici:</p>
<p><a href="${escapeHtml(input.reportUrl)}">${escapeHtml(input.reportUrl)}</a></p>
<p>Scor website: ${escapeHtml(input.score)}</p>
<p>Este o analiză independentă, nu un audit oficial Dacia. Dacă vreți să vorbim despre ce rămâne de făcut: ${escapeHtml(BRAND.phoneDisplay)} sau <a href="mailto:${BRAND.email}">${BRAND.email}</a>.</p>
<p>Alexandru Drăghici<br>${escapeHtml(BRAND.agency)}</p>
${input.pixelUrl ? `<img src="${escapeHtml(input.pixelUrl)}" width="1" height="1" alt="" />` : ""}`;

  return send({
    to: [input.to],
    subject,
    text,
    html,
  });
}
