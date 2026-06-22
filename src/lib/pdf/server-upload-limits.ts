/** Vercel serverless request body limit (~4.5 MB). Avoid sending raw files above this to API routes. */
export const VERCEL_SAFE_REQUEST_BYTES = 4 * 1024 * 1024;

/** Try lightweight PDF optimization at or above this size. */
export const PDF_OPTIMIZE_THRESHOLD_BYTES = 3 * 1024 * 1024;
