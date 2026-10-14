import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const directory = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(directory, "../../../.env");
if (!process.env.DATABASE_URL && existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Set it in the environment or root .env file.");
}

const confirmation = process.argv.find((argument) => argument.startsWith("--confirm-db="))?.slice("--confirm-db=".length);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const connection = await pool.connect();
  try {
    const { rows } = await connection.query(`
      SELECT current_database() AS database_name,
             COALESCE(inet_server_addr()::text, 'local socket') AS server_address,
             COALESCE(inet_server_port()::text, 'local socket') AS server_port
    `);
    const { database_name: databaseName, server_address: serverAddress, server_port: serverPort } = rows[0];

    const tableResult = await connection.query(`
      SELECT format('%I.%I', schemaname, tablename) AS qualified_name
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> 'ulamify_data_migrations'
      ORDER BY tablename
    `);
    const tableNames = tableResult.rows.map((row) => row.qualified_name);

    console.log(`Database: ${databaseName} (${serverAddress}:${serverPort})`);
    console.log(`Application tables to clear: ${tableNames.length ? tableNames.join(", ") : "none"}`);
    console.log("Migration bookkeeping tables are preserved.");

    if (confirmation !== databaseName) {
      console.error(`No data was changed. To proceed, pass --confirm-db=${databaseName}`);
      process.exitCode = 1;
    } else if (tableNames.length > 0) {
      await connection.query("BEGIN");
      try {
        await connection.query(`TRUNCATE TABLE ${tableNames.join(", ")} RESTART IDENTITY CASCADE`);
        await connection.query("COMMIT");
        console.log("Application data cleared successfully.");
      } catch (error) {
        await connection.query("ROLLBACK");
        throw error;
      }
    } else {
      console.log("No application tables found; nothing to clear.");
    }
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
