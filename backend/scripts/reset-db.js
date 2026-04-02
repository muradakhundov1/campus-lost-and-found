const fs = require('fs');
const path = require('path');
const { getDb, DB_PATH } = require('../db');

function nowIso() {
  return new Date().toISOString();
}

function run() {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const db = getDb();

  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  db.exec(schemaSql);
  console.log('✅ DB reset complete');
  console.log('DB:', DB_PATH);
}

run();

