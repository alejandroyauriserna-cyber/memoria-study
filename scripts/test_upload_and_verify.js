/*
  Usage:
    Set environment variables in your shell or .env:
      SUPABASE_URL
      SUPABASE_SERVICE_ROLE_KEY

    Then run:
      node scripts/test_upload_and_verify.js path/to/file.pdf 3

  The script will:
    - upload the provided PDF to the `shared-materials` bucket
    - insert a `materials` record using the service role key
    - query public materials for the requested cycle and print results

  Note: This script requires network access and a valid Supabase project.
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function sanitizeFileName(fileName) {
  const normalized = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lastDotIndex = normalized.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? normalized.substring(0, lastDotIndex) : normalized;
  const extension = lastDotIndex > 0 ? normalized.substring(lastDotIndex + 1) : 'pdf';

  const sanitizedName = nameWithoutExt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
  const finalName = sanitizedName || 'archivo';
  const finalExtension = sanitizedExtension ? `.${sanitizedExtension}` : '.pdf';
  return `${finalName}${finalExtension}`;
}

async function main() {
  const filePath = process.argv[2];
  const cycleNumberArg = process.argv[3] ?? '3';
  const cycleNumber = Number(cycleNumberArg);

  if (!filePath) {
    console.error('Usage: node scripts/test_upload_and_verify.js path/to/file.pdf [cycleNumber]');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  if (Number.isNaN(cycleNumber)) {
    console.error('cycleNumber must be a valid number');
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Aborting.');
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const bucket = 'shared-materials';

  // Check bucket (best-effort)
  try {
    const bucketInfo = await admin.storage.getBucket(bucket);
    if (bucketInfo.error) {
      console.warn('Bucket check error (attempt to create):', bucketInfo.error.message || bucketInfo.error);
      const createRes = await admin.storage.createBucket(bucket, { public: true });
      if (createRes.error) {
        console.error('Could not create bucket:', createRes.error);
        process.exit(1);
      }
    }
  } catch (err) {
    // SDK differences: ignore and continue
  }

  const originalFileName = path.basename(filePath);
  const sanitizedFileName = sanitizeFileName(originalFileName);
  const storagePath = `test-uploads/${Date.now()}-${sanitizedFileName}`;

  console.log('Uploading', originalFileName, 'as', storagePath);

  const fileStream = fs.createReadStream(filePath);
  const stat = fs.statSync(filePath);

  const { data: uploadData, error: uploadError } = await admin.storage.from(bucket).upload(storagePath, fileStream, {
    contentType: 'application/pdf',
    upsert: false,
  });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    process.exit(1);
  }

  const urlResult = admin.storage.from(bucket).getPublicUrl(storagePath);
  const publicUrl = urlResult?.data?.publicUrl ?? null;

  console.log('Uploaded. publicUrl=', publicUrl);

  // Insert materials record
  const payload = {
    user_id: null,
    author_name: 'Test Upload',
    title: `Test - ${sanitizedFileName}`,
    description: 'Archivo de prueba subido por script de verificación',
    course_id: 'test-course',
    course_name: 'Curso de prueba',
    cycle_number: cycleNumber,
    cycle_label: `Ciclo ${cycleNumber}`,
    material_type: 'pdf',
    file_name: sanitizedFileName,
    file_url: publicUrl,
    views: 0,
    downloads: 0,
    likes: 0,
    is_public: true,
  };

  const { data: insertData, error: insertError } = await admin.from('materials').insert(payload).select().single();
  if (insertError) {
    console.error('Insert error:', insertError);
    process.exit(1);
  }

  console.log('Inserted material id=', insertData.id);

  // Query materials for the cycle
  const { data: materials, error: materialsError } = await admin
    .from('materials')
    .select('*')
    .eq('is_public', true)
    .eq('cycle_number', cycleNumber)
    .order('created_at', { ascending: false });

  if (materialsError) {
    console.error('Query error:', materialsError);
    process.exit(1);
  }

  console.log(`Materials for cycle ${cycleNumber}:`, (materials ?? []).length);
  for (const m of materials ?? []) {
    console.log('-', m.id, m.title, m.file_name, m.file_url);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
