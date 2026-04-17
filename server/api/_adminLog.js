const { query } = require('./_db');
const { json } = require('./_util');
const { requireUserId } = require('./_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  const u = await query('select role from users where id = $1', [userId]);
  if (u.rows[0]?.role !== 'admin') return json(res, 403, { error: 'forbidden' });

  try {
    const r = await query('select id, action, target, note, admin_id, at from admin_log order by at desc limit 100');
    const logs = r.rows.map((row) => ({
      id: row.id,
      action: row.action,
      target: row.target,
      note: row.note,
      adminId: row.admin_id,
      at: row.at ? new Date(row.at).toISOString() : ''
    }));
    return json(res, 200, { adminLog: logs });
  } catch (e) {
    console.error('[admin/log]', e);
    return json(res, 500, { error: 'server_error' });
  }
};

