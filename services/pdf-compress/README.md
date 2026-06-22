# Compresión PDF (Ghostscript) — microservicio MemoriaStudy

Motor **Ghostscript** (mismo tipo que usa iLovePDF) para PDFs muy grandes o con muchas páginas. La app principal lo usa cuando el navegador tardaría demasiado.

## Arquitectura

```
Estudiante → MemoriaStudy (Vercel)
              → sube PDF temporal a Supabase
              → POST /api/pdf/compress
                 → microservicio POST /compress (Ghostscript)
              → PDF comprimido en Storage → continúa el flujo normal
```

## 1. Generar secreto compartido

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guárdalo como `PDF_COMPRESS_SERVICE_SECRET` (mismo valor en Fly y en Vercel).

## 2. Desplegar en Fly.io

```bash
cd services/pdf-compress
fly auth login
fly apps create memoriastudy-pdf-compress   # una sola vez
fly secrets set PDF_COMPRESS_SERVICE_SECRET=tu_secreto_aqui
fly deploy
```

Anota la URL: `https://memoriastudy-pdf-compress.fly.dev`

## 3. Variables en Vercel (MemoriaStudy)

| Variable | Valor |
|----------|--------|
| `PDF_COMPRESS_SERVICE_URL` | `https://memoriastudy-pdf-compress.fly.dev` |
| `PDF_COMPRESS_SERVICE_SECRET` | el mismo secreto que en Fly |

## 4. Supabase

Ejecuta la migración `20260626_pdf_compress_temp_bucket.sql` (bucket temporal para comprimir).

## 5. Probar salud

```bash
curl https://memoriastudy-pdf-compress.fly.dev/health
```

## Coste orientativo

- Fly.io: máquina 1 GB RAM, `min_machines_running = 0` → suele quedar en **~$0–5/mes** con uso estudiantil moderado.
- Escala automática: la máquina arranca cuando un estudiante comprime un PDF grande.

## Presets

| Preset | Ghostscript | Uso |
|--------|-------------|-----|
| `recommended` | `/ebook` | Casaciones y materiales (default) |
| `extreme` | `/screen` | PDFs enormes escaneados |
| `light` | `/printer` | Más calidad, menos compresión |

## Local (opcional)

Requiere [Ghostscript](https://ghostscript.com/releases/gsdnld.html) instalado (`gs` en PATH).

```bash
cd services/pdf-compress
PDF_COMPRESS_SERVICE_SECRET=devsecret node server.mjs
```
