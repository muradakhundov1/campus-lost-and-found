const { query } = require('./_db');
const { json, authToken } = require('./_util');

/** @returns {Promise<string|null>} user id or null (sends 401 if res provided and unauthorized) */
async function requireUserId(req, res) {
  const t = authToken(req);
  if (!t) {
    if (res) json(res, 401, { error: 'unauthorized' });
    return null;
  }
  const s = await query('select user_id from sessions where token = $1 limit 1', [t]);
  const userId = s.rows[0]?.user_id;
  if (!userId) {
    if (res) json(res, 401, { error: 'unauthorized' });
    return null;
  }
  return userId;
}

/** Optional auth — no 401 */
async function optionalUserId(req) {
  const t = authToken(req);
  if (!t) return null;
  const s = await query('select user_id from sessions where token = $1 limit 1', [t]);
  return s.rows[0]?.user_id || null;
}

module.exports = { requireUserId, optionalUserId };
