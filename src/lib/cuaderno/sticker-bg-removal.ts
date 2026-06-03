/** Elimina fondos uniformes (blanco/gris) para stickers tipo GoodNotes. */

function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function sampleCorners(data: Uint8ClampedArray, w: number, h: number) {
  const pts = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [0, Math.floor(h / 2)],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of pts) {
    const i = (y * w + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const n = pts.length;
  return { r: r / n, g: g / n, b: b / n };
}

export async function loadImageFromSource(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
  return img;
}

export async function removeBackgroundToPngDataUrl(
  src: string,
  options?: { threshold?: number; feather?: number },
): Promise<string> {
  const threshold = options?.threshold ?? 42;
  const feather = options?.feather ?? 18;
  const img = await loadImageFromSource(src);
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const bg = sampleCorners(data, w, h);

  for (let i = 0; i < data.length; i += 4) {
    const d = colorDist(data[i], data[i + 1], data[i + 2], bg.r, bg.g, bg.b);
    if (d < threshold) {
      data[i + 3] = 0;
    } else if (d < threshold + feather) {
      const t = (d - threshold) / feather;
      data[i + 3] = Math.round(data[i + 3] * t);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Error al leer archivo"));
    reader.readAsDataURL(file);
  });
}
