// Captures above-the-fold desktop and mobile screenshots of a site so the model
// can judge the visual first impression and mobile feel. Server-only (Playwright).
//
// Requires a one-time browser install:  npx playwright install chromium
// Every failure degrades to null — the audit still runs on page text alone.

import type { Browser, BrowserContextOptions } from "playwright";
import { normalizeUrl } from "./fetchSite";

export interface SiteScreenshots {
  desktop: string | null; // base64 PNG
  mobile: string | null; // base64 PNG
}

export async function captureScreenshots(url: string): Promise<SiteScreenshots> {
  const target = normalizeUrl(url);
  if (!target) return { desktop: null, mobile: null };

  let chromium;
  let devices;
  try {
    ({ chromium, devices } = await import("playwright"));
  } catch (err) {
    console.error("Playwright is not installed; skipping screenshots:", err);
    return { desktop: null, mobile: null };
  }

  let browser: Browser;
  try {
    browser = await chromium.launch({ args: ["--no-sandbox"] });
  } catch (err) {
    console.error(
      "Could not launch Chromium (run: npx playwright install chromium):",
      err,
    );
    return { desktop: null, mobile: null };
  }

  try {
    const desktop = await shoot(browser, target, {
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const mobile = await shoot(browser, target, devices["iPhone 13"]);
    return { desktop, mobile };
  } finally {
    await browser.close().catch(() => {});
  }
}

async function shoot(
  browser: Browser,
  url: string,
  contextOptions: BrowserContextOptions,
): Promise<string | null> {
  const context = await browser.newContext(contextOptions);
  try {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    } catch {
      // networkidle can time out on busy pages — fall back to a basic load.
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    }
    await page.waitForTimeout(1200);
    const buffer = await page.screenshot({ type: "png" }); // viewport = above the fold
    return buffer.toString("base64");
  } catch (err) {
    console.error("Screenshot failed:", err);
    return null;
  } finally {
    await context.close().catch(() => {});
  }
}
