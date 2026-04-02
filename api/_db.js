const { Pool } = require('pg');

let pool;

/** Supabase transaction pooler (port 6543) requires disabling prepared statements for node-pg. */
function connectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  const isTransactionPooler =
    /pooler\.supabase\.com/.test(raw) || /:6543(\/|\?|$)/.test(raw);
  if (!isTransactionPooler || raw.includes('pgbouncer=true')) return raw;
  return raw + (raw.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('Missing DATABASE_URL');
    }
    pool = new Pool({
      connectionString: connectionString(),
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  return await p.query(text, params);
}

module.exports = { query };

