import type { Browser } from "playwright-core";

export async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  const onVercel = Boolean(process.env.VERCEL);

  if (onVercel) {
    process.env.AWS_LAMBDA_JS_RUNTIME ??= "nodejs22.x";
    const chromiumPack = (await import("@sparticuz/chromium")).default;
    chromiumPack.setGraphicsMode = false;
    const executablePath = await chromiumPack.executablePath();
    process.env.LD_LIBRARY_PATH = [
      executablePath.replace(/\/[^/]+$/, ""),
      process.env.LD_LIBRARY_PATH || "",
    ]
      .filter(Boolean)
      .join(":");
    return chromium.launch({
      args: [...chromiumPack.args, "--hide-scrollbars"],
      executablePath,
      headless: true,
    });
  }

  return chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--hide-scrollbars"],
  });
}
