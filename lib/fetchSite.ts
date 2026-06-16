// Fetches a website's homepage and reduces it to plain visible text for the model.
// Server-only (uses global fetch + runs at request time). Returns null on failure
// so the caller can degrade gracefully.

export interface SiteContent {
  url: string;
  finalUrl: string;
  title: string;
  text: string;
}

const MAX_TEXT_CHARS = 12000;

export function normalizeUrl(url: string): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function fetchSiteContent(url: string): Promise<SiteContent | null> {
  const target = normalizeUrl(url);
  if (!target) return null;
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OstavoAuditBot/1.0; +https://ostavo.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    return {
      url: target,
      finalUrl: res.url || target,
      title: extractTitle(html),
      text: htmlToText(html).slice(0, MAX_TEXT_CHARS),
    };
  } catch (err) {
    console.error("fetchSiteContent failed:", err);
    return null;
  }
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : "";
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/(p|div|li|h[1-6]|section|header|footer|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
}
