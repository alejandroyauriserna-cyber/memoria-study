import { PDFDocument } from 'pdf-lib';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 200]);
  page.drawText('Este es un PDF de prueba para extracción de texto.', {
    x: 50,
    y: 100,
    size: 14,
  });
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function test() {
  const buffer = await createPdf();
  console.log('pdf buffer length', buffer.length);
  const { extractPdfFromBuffer } = await import('./src/lib/pdf/extract.ts');
  try {
    const result = await extractPdfFromBuffer(buffer, 'test.pdf', {
      onProgress: (p) => console.log('progress', p),
    });
    console.log('extract result', result);
  } catch (error) {
    console.error('extract error', error);
  }
}

test();
