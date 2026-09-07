import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Prefer a single DATABASE_URL (used by Render and most managed
// Postgres providers). Fall back to discrete connection vars for
// local development.
const useConnectionString = Boolean(process.env.DATABASE_URL);

// Enable SSL for managed/hosted databases. Render's PostgreSQL
// requires SSL. Allow it to be forced on/off via PGSSL if needed.
const shouldUseSsl =
    process.env.PGSSL === "true" ||
    (process.env.NODE_ENV === "production" && useConnectionString);

const pool = new Pool(
    useConnectionString
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: shouldUseSsl
                  ? { rejectUnauthorized: false }
                  : false,
          }
        : {
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              user: process.env.DB_USER,
              password: process.env.DB_PASSWORD,
              database: process.env.DB_NAME,
              ssl: shouldUseSsl
                  ? { rejectUnauthorized: false }
                  : false,
          }
);

export default pool;
