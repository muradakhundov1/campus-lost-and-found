const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'dev.sqlite3');

let db;
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    const itemCols = db.prepare("PRAGMA table_info('items')").all();
    if (Array.isArray(itemCols) && !itemCols.some((c) => c.name === 'photo_url')) {
      db.prepare('ALTER TABLE items ADD COLUMN photo_url TEXT').run();
    }
  }
  return db;
}

module.exports = { getDb, DB_PATH };

