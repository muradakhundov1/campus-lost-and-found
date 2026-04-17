const { query } = require('./_db');
const { json } = require('./_util');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const id = req.query.id;
  if (!id) return json(res, 400, { error: 'invalid_request' });

  try {
    const r = await query('select id, name, avatar from users where id = $1 limit 1', [id]);
    const u = r.rows[0];
    if (!u) return json(res, 404, { error: 'not_found' });
    return json(res, 200, { user: { id: u.id, name: u.name, avatar: u.avatar } });
  } catch (e) {
    console.error('[users GET]', e);
    return json(res, 500, { error: 'server_error' });
  }
};

