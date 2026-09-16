import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditReport } from "./types";

const LOCAL_DIR = path.join(process.cwd(), ".data", "reports");

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
}

export async function saveReport(report: AuditReport): Promise<{ id: string; persisted: boolean }> {
  const json = JSON.stringify(report);
  let persisted = false;

  try {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, `${report.id}.json`), json, "utf8");
    persisted = true;
  } catch {
    /* vercel filesystem is read-only except /tmp */
    try {
      await mkdir("/tmp/standarde-digitale-reports", { recursive: true });
      await writeFile(
        `/tmp/standarde-digitale-reports/${report.id}.json`,
        json,
        "utf8",
      );
    } catch {
      /* ignore */
    }
  }

  const token = blobToken();
  if (token) {
    const { put } = await import("@vercel/blob");
    await put(`reports/${report.id}.json`, json, {
      access: "public",
      token,
      contentType: "application/json",
      addRandomSuffix: false,
    });
    persisted = true;
  }

  return { id: report.id, persisted };
}

export async function loadReport(id: string): Promise<AuditReport | null> {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return null;

  const token = blobToken();
  if (token) {
    try {
      const { list } = await import("@vercel/blob");
      const listed = await list({ prefix: `reports/${id}`, token });
      const file = listed.blobs.find((b) => b.pathname.endsWith(`${id}.json`));
      if (file) {
        const res = await fetch(file.url);
        if (res.ok) return (await res.json()) as AuditReport;
      }
    } catch {
      /* fall through */
    }
  }

  for (const dir of [LOCAL_DIR, "/tmp/standarde-digitale-reports"]) {
    try {
      const raw = await readFile(path.join(dir, `${id}.json`), "utf8");
      return JSON.parse(raw) as AuditReport;
    } catch {
      /* next */
    }
  }
  return null;
}
