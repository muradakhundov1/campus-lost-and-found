const { query } = require('./_db');
const { json } = require('./_util');
const { mapItem } = require('./_itemsMap');
const { requireUserId } = require('./_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();

  const id = req.query.id;
  if (!id) return json(res, 400, { error: 'invalid_request' });

  if (req.method === 'GET') {
    try {
      const r = await query('select * from items where id = $1', [id]);
      if (!r.rows[0]) return json(res, 404, { error: 'not_found' });
      return json(res, 200, { item: mapItem(r.rows[0]) });
    } catch (e) {
      console.error('[items/:id GET]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  if (req.method === 'DELETE') {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    try {
      const it = await query('select poster_id from items where id = $1', [id]);
      if (!it.rows[0]) return json(res, 404, { error: 'not_found' });
      const role = await query('select role from users where id = $1', [userId]);
      const isAdmin = role.rows[0]?.role === 'admin';
      if (it.rows[0].poster_id !== userId && !isAdmin) return json(res, 403, { error: 'forbidden' });

      await query('delete from items where id = $1', [id]);
      return json(res, 200, { ok: true });
    } catch (e) {
      console.error('[items/:id DELETE]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  if (req.method === 'PATCH') {
    const userId = await requireUserId(req, res);
    if (!userId) return;

    const { readJson } = require('./_util');
    let body;
    try {
      body = await readJson(req);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }
    const status = body?.status;
    if (!status || typeof status !== 'string') return json(res, 400, { error: 'invalid_request' });

    try {
      const it = await query('select poster_id from items where id = $1', [id]);
      if (!it.rows[0]) return json(res, 404, { error: 'not_found' });
      const role = await query('select role from users where id = $1', [userId]);
      const isAdmin = role.rows[0]?.role === 'admin';
      if (it.rows[0].poster_id !== userId && !isAdmin) return json(res, 403, { error: 'forbidden' });

      await query('update items set status = $1, updated_at = now() where id = $2', [status, id]);
      const row = (await query('select * from items where id = $1', [id])).rows[0];
      return json(res, 200, { item: mapItem(row) });
    } catch (e) {
      console.error('[items/:id PATCH]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
};
