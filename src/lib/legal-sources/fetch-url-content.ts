const FETCH_TIMEOUT_MS = 45_000;
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type FetchUrlContentResult = {
  html: string;
  fetchMode: "direct" | "wayback";
  waybackTimestamp?: string;
  waybackUrl?: string;
};

function browserHeaders(url: string): HeadersInit {
  const parsed = new URL(url);
  return {
    "User-Agent": CHROME_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
    Referer: `${parsed.protocol}//${parsed.hostname}/`,
    "Cache-Control": "no-cache",
    "Upgrade-Insecure-Requests": "1",
  };
}

function jsonHeaders(): HeadersInit {
  return {
    "User-Agent": CHROME_UA,
    Accept: "application/json",
  };
}

export function isLpDerechoUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname === "lpderecho.pe";
  } catch {
    return false;
  }
}

function isCloudflareBlock(status: number, html: string): boolean {
  if (status === 403 || status === 429 || status === 503) {
    return true;
  }
  const probe = html.slice(0, 8000).toLowerCase();
  return (
    probe.includes("just a moment") ||
    probe.includes("cf-mitigated") ||
    probe.includes("enable javascript and cookies") ||
    probe.includes("attention required")
  );
}

async function fetchWithTimeout(url: string, headers: HeadersInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function waybackLookupVariants(url: string): string[] {
  const parsed = new URL(url);
  const variants = new Set<string>();
  variants.add(parsed.href);

  const withoutWww = parsed.hostname.replace(/^www\./, "");
  variants.add(`${parsed.protocol}//${withoutWww}${parsed.pathname}${parsed.search}`);

  if (!parsed.hostname.startsWith("www.")) {
    variants.add(`${parsed.protocol}//www.${withoutWww}${parsed.pathname}${parsed.search}`);
  }

  if (!parsed.pathname.endsWith("/")) {
    variants.add(`${parsed.protocol}//${parsed.hostname}${parsed.pathname}/${parsed.search}`);
  }

  return [...variants];
}

async function findWaybackSnapshot(
  originalUrl: string,
): Promise<{ snapshotUrl: string; timestamp: string } | null> {
  for (const variant of waybackLookupVariants(originalUrl)) {
    const api = `https://archive.org/wayback/available?url=${encodeURIComponent(variant)}`;
    const response = await fetchWithTimeout(api, jsonHeaders());
    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as {
      archived_snapshots?: {
        closest?: { available?: boolean; url?: string; timestamp?: string };
      };
    };
    const closest = data.archived_snapshots?.closest;
    if (closest?.available && closest.url && closest.timestamp) {
      return { snapshotUrl: closest.url, timestamp: closest.timestamp };
    }
  }

  const parsed = new URL(originalUrl);
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(
    `${parsed.hostname}${parsed.pathname}`,
  )}&output=json&limit=1&filter=statuscode:200&sort=reverse`;
  const cdxResponse = await fetchWithTimeout(cdxUrl, jsonHeaders());
  if (!cdxResponse.ok) {
    return null;
  }

  const rows = (await cdxResponse.json()) as string[][];
  if (!Array.isArray(rows) || rows.length < 2) {
    return null;
  }

  const [, timestamp, archivedOriginal] = rows[1]!;
  if (!timestamp || !archivedOriginal) {
    return null;
  }

  return {
    snapshotUrl: `http://web.archive.org/web/${timestamp}/${archivedOriginal}`,
    timestamp,
  };
}

async function fetchDirectHtml(url: string): Promise<{ html: string; status: number }> {
  const response = await fetchWithTimeout(url, browserHeaders(url));
  const html = await response.text();
  return { html, status: response.status };
}

async function fetchWaybackHtml(originalUrl: string): Promise<{
  html: string;
  waybackTimestamp: string;
  waybackUrl: string;
}> {
  const snapshot = await findWaybackSnapshot(originalUrl);
  if (!snapshot) {
    throw new Error(
      "LP Derecho bloquea la descarga automática y no hay copia archivada disponible. Intenta más tarde.",
    );
  }

  const response = await fetchWithTimeout(snapshot.snapshotUrl, browserHeaders(snapshot.snapshotUrl));
  if (!response.ok) {
    throw new Error(`No se pudo descargar la copia archivada (${response.status}).`);
  }

  const html = await response.text();
  if (!html.trim() || isCloudflareBlock(response.status, html)) {
    throw new Error("La copia archivada está vacía o no es utilizable.");
  }

  return {
    html,
    waybackTimestamp: snapshot.timestamp,
    waybackUrl: snapshot.snapshotUrl,
  };
}

export function formatWaybackDate(timestamp: string): string {
  if (timestamp.length < 8) {
    return timestamp;
  }
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
}

export function buildWaybackSyncNote(timestamp?: string): string {
  if (!timestamp) {
    return " Sincronizado vía Internet Archive porque LP Derecho bloqueó el acceso directo; el texto puede no estar al día.";
  }
  return ` Sincronizado vía Internet Archive (${formatWaybackDate(timestamp)}) porque LP Derecho bloqueó el acceso directo; el texto puede no estar al día.`;
}

export async function fetchUrlContentDetailed(url: string): Promise<FetchUrlContentResult> {
  try {
    const { html, status } = await fetchDirectHtml(url);
    if (status >= 200 && status < 300 && html.trim() && !isCloudflareBlock(status, html)) {
      return { html, fetchMode: "direct" };
    }

    if (!isLpDerechoUrl(url)) {
      throw new Error(`No se pudo descargar la página (${status}).`);
    }
  } catch (error) {
    if (!isLpDerechoUrl(url)) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Tiempo de espera agotado al descargar la fuente web.");
      }
      throw error;
    }
  }

  const wayback = await fetchWaybackHtml(url);
  return {
    html: wayback.html,
    fetchMode: "wayback",
    waybackTimestamp: wayback.waybackTimestamp,
    waybackUrl: wayback.waybackUrl,
  };
}

export async function fetchUrlContent(url: string): Promise<string> {
  const result = await fetchUrlContentDetailed(url);
  return result.html;
}
