/**
 * Aplica 20260603_cuaderno_collections_covers.sql al proyecto remoto.
 * Requiere: SUPABASE_DB_PASSWORD en el entorno (contraseña de postgres del dashboard).
 *
 * Uso:
 *   $env:SUPABASE_DB_PASSWORD="tu-password"
 *   node scripts/push-migration-20260603.mjs
 */
import fs from "fs";
import path from "path";
import pg from "pg";

const PROJECT_REF = "qneqbcsukbqzulhamkay";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Falta SUPABASE_DB_PASSWORD (contraseña de BD en Supabase → Settings → Database).");
  process.exit(1);
}

const sqlPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260603_cuaderno_collections_covers.sql",
);
const sql = fs.readFileSync(sqlPath, "utf8");

const hosts = [
  `db.${PROJECT_REF}.supabase.co`,
  `aws-0-us-east-1.pooler.supabase.com`,
  `aws-0-us-west-1.pooler.supabase.com`,
  `aws-0-sa-east-1.pooler.supabase.com`,
];

async function tryHost(host, port, user) {
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  });
  await client.connect();
  return client;
}

async function main() {
  let client;
  const attempts = [
    { host: hosts[0], port: 5432, user: "postgres" },
    { host: hosts[0], port: 5432, user: `postgres.${PROJECT_REF}` },
    ...hosts.slice(1).map((host) => ({ host, port: 6543, user: `postgres.${PROJECT_REF}` })),
  ];

  for (const a of attempts) {
    try {
      console.log(`Conectando ${a.user}@${a.host}:${a.port}…`);
      client = await tryHost(a.host, a.port, a.user);
      console.log("Conexión OK.");
      break;
    } catch (e) {
      console.warn(`  Falló: ${e.message}`);
    }
  }

  if (!client) {
    console.error("No se pudo conectar. Verifica SUPABASE_DB_PASSWORD y región del proyecto.");
    process.exit(1);
  }

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(`
      INSERT INTO supabase_migrations.schema_migrations (version, name)
      VALUES ('20260603', 'cuaderno_collections_covers')
      ON CONFLICT DO NOTHING;
    `).catch(() => {
      console.warn("(Aviso) No se registró en schema_migrations; puede que la tabla no exista si no usas CLI.");
    });
    await client.query("COMMIT");
    console.log("Migración 20260603 aplicada correctamente.");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error ejecutando SQL:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
