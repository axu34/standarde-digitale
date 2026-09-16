import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { AuditReport } from "./types";

const LOCAL_DIR = path.join(process.cwd(), ".data", "reports");
const LOCAL_ROOT = path.join(process.cwd(), ".data");

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
}

export async function putJson(pathname: string, data: unknown): Promise<boolean> {
  const json = JSON.stringify(data);
  let ok = false;
  try {
    const full = path.join(LOCAL_ROOT, pathname);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, json, "utf8");
    ok = true;
  } catch {
    try {
      const full = path.join("/tmp/standarde-digitale", pathname);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, json, "utf8");
      ok = true;
    } catch {
      /* ignore */
    }
  }
  const token = blobToken();
  if (token) {
    const { put } = await import("@vercel/blob");
    await put(pathname, json, {
      access: "public",
      token,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    ok = true;
  }
  return ok;
}

export async function loadJson<T>(pathname: string): Promise<T | null> {
  const token = blobToken();
  if (token) {
    try {
      const { list } = await import("@vercel/blob");
      const listed = await list({ prefix: pathname.replace(/\.json$/, ""), token });
      const file = listed.blobs.find((b) => b.pathname === pathname || b.pathname.endsWith(`/${pathname}`));
      const match =
        listed.blobs.find((b) => b.pathname === pathname) ||
        listed.blobs.find((b) => b.pathname.endsWith(pathname.split("/").pop() || "___"));
      const url = (file || match)?.url;
      if (url) {
        const res = await fetch(url);
        if (res.ok) return (await res.json()) as T;
      }
    } catch {
      /* fall through */
    }
  }
  for (const root of [LOCAL_ROOT, "/tmp/standarde-digitale"]) {
    try {
      const raw = await readFile(path.join(root, pathname), "utf8");
      return JSON.parse(raw) as T;
    } catch {
      /* next */
    }
  }
  return null;
}

export async function listJson<T>(prefix: string, limit = 80): Promise<T[]> {
  const out: T[] = [];
  const token = blobToken();
  if (token) {
    try {
      const { list } = await import("@vercel/blob");
      const listed = await list({ prefix, token });
      const blobs = listed.blobs.slice(0, limit);
      const loaded = await Promise.all(
        blobs.map(async (b) => {
          try {
            const res = await fetch(b.url);
            if (!res.ok) return null;
            return (await res.json()) as T;
          } catch {
            return null;
          }
        }),
      );
      for (const item of loaded) if (item) out.push(item);
      if (out.length) return out;
    } catch {
      /* fall through */
    }
  }
  for (const root of [LOCAL_ROOT, "/tmp/standarde-digitale"]) {
    try {
      const dir = path.join(root, prefix);
      const names = (await readdir(dir)).filter((n) => n.endsWith(".json")).slice(0, limit);
      for (const name of names) {
        try {
          out.push(JSON.parse(await readFile(path.join(dir, name), "utf8")) as T);
        } catch {
          /* skip */
        }
      }
      if (out.length) return out;
    } catch {
      /* next */
    }
  }
  return out;
}

export async function saveReport(report: AuditReport): Promise<{ id: string; persisted: boolean }> {
  const json = JSON.stringify(report);
  let persisted = false;

  try {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, `${report.id}.json`), json, "utf8");
    persisted = true;
  } catch {
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
      allowOverwrite: true,
    });
    persisted = true;
  }

  return { id: report.id, persisted };
}

export async function loadReport(id: string): Promise<AuditReport | null> {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return null;

  const fromBlob = await loadJson<AuditReport>(`reports/${id}.json`);
  if (fromBlob) return fromBlob;

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

