#!/usr/bin/env node
import { extractImageUrlFromHtml } from "../src/lib/cuaderno/resolve-import-image-url.ts";

const html = `
<meta property="og:image" content="https://i.pinimg.com/736x/ab/cd/ef/abcdef.png" />
`;

const url = extractImageUrlFromHtml(html, "https://www.pinterest.com/pin/123/");
if (!url?.includes("pinimg.com")) {
  console.error("FAIL: og:image extraction");
  process.exit(1);
}
console.log("OK: Pinterest og:image ->", url);
