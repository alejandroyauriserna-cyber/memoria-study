const IMAGE_EXT = /\.(png|jpe?g|webp|gif)(\?|$)/i;

/** Extrae URL de imagen desde HTML (Pinterest, OG tags, pinimg). */
export function extractImageUrlFromHtml(html: string, pageUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /https:\/\/i\.pinimg\.com\/[^"'\s<>]+\.(?:png|jpg|jpeg|webp)/i,
    /https:\/\/[^"'\s<>]+\.(?:png|jpg|jpeg|webp)(?:\?[^"'\s<>]*)?/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1] && IMAGE_EXT.test(m[1])) return m[1].replace(/&amp;/g, "&");
    if (m?.[0] && IMAGE_EXT.test(m[0])) return m[0].replace(/&amp;/g, "&");
  }

  try {
    const u = new URL(pageUrl);
    if (u.hostname.includes("pinimg.com") && IMAGE_EXT.test(u.pathname)) return pageUrl;
  } catch {
    /* ignore */
  }

  return null;
}

export function isLikelyImageContentType(ct: string): boolean {
  return /^image\/(png|jpeg|webp|gif)/i.test(ct);
}

export function isHtmlContentType(ct: string): boolean {
  return ct.includes("text/html") || ct.includes("application/xhtml");
}
