const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function token() {
  return crypto.randomBytes(24).toString('hex');
}

function newId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function avatarFromName(name) {
  const parts = String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2);
  const a = parts.map((p) => p[0].toUpperCase()).join('');
  return a || 'U';
}

function authToken(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

module.exports = { json, readJson, token, newId, avatarFromName, authToken };

