import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8080);
const SECRET = process.env.PDF_COMPRESS_SERVICE_SECRET ?? "";
const MAX_BYTES = Number(process.env.PDF_COMPRESS_MAX_BYTES ?? 157286400);
const DOWNLOAD_TIMEOUT_MS = Number(process.env.PDF_COMPRESS_DOWNLOAD_TIMEOUT_MS ?? 120_000);
const GS_TIMEOUT_MS = Number(process.env.PDF_COMPRESS_GS_TIMEOUT_MS ?? 180_000);

/** Ghostscript PDFSETTINGS — equivalente a presets de iLovePDF. */
const PRESETS = {
  recommended: "/ebook",
  extreme: "/screen",
  light: "/printer",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > 4096) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function runGhostscript(inputPath, outputPath, presetKey) {
  const pdfSettings = PRESETS[presetKey] ?? PRESETS.recommended;

  return new Promise((resolve, reject) => {
    const args = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${pdfSettings}`,
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    const child = spawn("gs", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Ghostscript timeout"));
    }, GS_TIMEOUT_MS);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `Ghostscript exited with code ${code}`));
    });
  });
}

async function downloadToFile(sourceUrl, targetPath) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }

    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) {
      throw new Error("PDF exceeds compress service limit");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("PDF exceeds compress service limit");
    }

    await writeFile(targetPath, buffer);
    return buffer.byteLength;
  } finally {
    clearTimeout(timer);
  }
}

async function handleCompress(req, res) {
  const auth = req.headers.authorization ?? "";
  if (!SECRET || auth !== `Bearer ${SECRET}`) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const preset =
    typeof body.preset === "string" && body.preset in PRESETS ? body.preset : "recommended";

  if (!sourceUrl.startsWith("http://") && !sourceUrl.startsWith("https://")) {
    sendJson(res, 400, { error: "sourceUrl is required" });
    return;
  }

  const workDir = await mkdtemp(join(tmpdir(), "ms-pdf-"));
  const inputPath = join(workDir, `${randomUUID()}-in.pdf`);
  const outputPath = join(workDir, `${randomUUID()}-out.pdf`);

  try {
    const originalBytes = await downloadToFile(sourceUrl, inputPath);
    await runGhostscript(inputPath, outputPath, preset);
    const compressed = await readFile(outputPath);

    if (!compressed.byteLength) {
      sendJson(res, 500, { error: "Empty compressed PDF" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": String(compressed.byteLength),
      "X-Original-Bytes": String(originalBytes),
      "X-Compressed-Bytes": String(compressed.byteLength),
      "X-Compress-Preset": preset,
    });
    res.end(compressed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compress failed";
    sendJson(res, 500, { error: message });
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { ok: true, service: "pdf-compress" });
      return;
    }

    if (req.method === "POST" && req.url === "/compress") {
      await handleCompress(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`pdf-compress listening on :${PORT}`);
});
