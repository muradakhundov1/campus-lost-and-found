const { query } = require('./_db');
const { json, readJson } = require('./_util');
const { requireUserId } = require('./_auth');
const { mapNotificationRow } = require('./_claimMap');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();

  const userId = await requireUserId(req, res);
  if (!userId) return;

  if (req.method === 'GET') {
    try {
      const r = await query('select * from notifications where user_id = $1 order by created_at desc limit 200', [userId]);
      return json(res, 200, { notifications: r.rows.map(mapNotificationRow) });
    } catch (e) {
      console.error('[notifications GET]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }
    if (body.markAllRead) {
      try {
        await query('update notifications set read = true where user_id = $1', [userId]);
        return json(res, 200, { ok: true });
      } catch (e) {
        console.error('[notifications markAllRead]', e);
        return json(res, 500, { error: 'server_error' });
      }
    }
    return json(res, 400, { error: 'invalid_request' });
  }

  return json(res, 405, { error: 'method_not_allowed' });
};

